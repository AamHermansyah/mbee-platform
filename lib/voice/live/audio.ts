/**
 * Audio browser untuk Gemini Live (pengganti jalur WebRTC/aiortc di server Python teman):
 * - Mikrofon → AudioWorklet → PCM16 mono 16 kHz → base64 per 100 ms.
 * - Audio jawaban PCM16 24 kHz (base64) → dijadwalkan berurutan di Web Audio, bisa dihentikan saat
 *   pelanggan memotong (interrupted).
 */

const INPUT_RATE = 16_000
const OUTPUT_RATE = 24_000
const CHUNK_SAMPLES = 1_600 // 100 ms pada 16 kHz

/**
 * Selama Mbee berbicara, potongan mic yang pelan (kemungkinan gema speaker) tidak dikirim supaya
 * Mbee tidak memotong dirinya sendiri. Suara pelanggan yang cukup keras tetap lewat (barge-in).
 */
const ECHO_GATE_RMS = 0.05

// Downsample sederhana (rata-rata kotak) dari sample rate perangkat ke 16 kHz, kirim tiap 100 ms.
const WORKLET_SOURCE = `
class MbeeCapture extends AudioWorkletProcessor {
  constructor() {
    super()
    this.ratio = sampleRate / ${INPUT_RATE}
    this.pos = 0
    this.acc = 0
    this.cnt = 0
    this.out = new Int16Array(${CHUNK_SAMPLES})
    this.n = 0
    this.sq = 0
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0]
    if (!ch) return true
    for (let i = 0; i < ch.length; i++) {
      this.acc += ch[i]
      this.cnt++
      this.pos += 1
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio
        const v = Math.max(-1, Math.min(1, this.acc / this.cnt))
        this.acc = 0
        this.cnt = 0
        this.sq += v * v
        this.out[this.n++] = v < 0 ? v * 0x8000 : v * 0x7fff
        if (this.n === this.out.length) {
          const rms = Math.sqrt(this.sq / this.n)
          this.port.postMessage({ pcm: this.out.buffer, rms }, [this.out.buffer])
          this.out = new Int16Array(${CHUNK_SAMPLES})
          this.n = 0
          this.sq = 0
        }
      }
    }
    return true
  }
}
registerProcessor("mbee-capture", MbeeCapture)
`

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function fromBase64(data: string): Int16Array {
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2))
}

/**
 * AudioWorklet kadang tidak pernah siap (addModule menggantung) di lingkungan tanpa perangkat audio
 * yang wajar. Setelah batas waktu, pakai ScriptProcessorNode (usang tetapi didukung semua browser).
 */
const WORKLET_TIMEOUT_MS = 3_000

async function loadWorklet(ctx: AudioContext): Promise<AudioWorkletNode | null> {
  if (!ctx.audioWorklet) return null
  const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }))
  try {
    const loaded = await Promise.race([
      ctx.audioWorklet.addModule(url).then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), WORKLET_TIMEOUT_MS)),
    ])
    return loaded ? new AudioWorkletNode(ctx, "mbee-capture") : null
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Cadangan perekam di main thread: downsample ke 16 kHz dan kirim tiap 100 ms, sama seperti worklet. */
function createScriptCapture(ctx: AudioContext, onChunk: (pcm: ArrayBuffer, rms: number) => void): ScriptProcessorNode {
  const node = ctx.createScriptProcessor(4096, 1, 1)
  const ratio = ctx.sampleRate / INPUT_RATE
  let pos = 0
  let acc = 0
  let cnt = 0
  let sq = 0
  let n = 0
  let out = new Int16Array(CHUNK_SAMPLES)
  node.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0)
    for (let i = 0; i < input.length; i++) {
      acc += input[i]
      cnt++
      pos += 1
      if (pos < ratio) continue
      pos -= ratio
      const v = Math.max(-1, Math.min(1, acc / cnt))
      acc = 0
      cnt = 0
      sq += v * v
      out[n++] = v < 0 ? v * 0x8000 : v * 0x7fff
      if (n === out.length) {
        onChunk(out.buffer, Math.sqrt(sq / n))
        out = new Int16Array(CHUNK_SAMPLES)
        n = 0
        sq = 0
      }
    }
  }
  return node
}

export interface LiveAudioHandlers {
  /** Potongan mic siap dikirim (base64 PCM16 16 kHz). */
  onChunk: (base64: string) => void
  /** true saat audio Mbee mulai terdengar, false saat antrean habis. */
  onPlayback: (playing: boolean) => void
}

export class LiveAudio {
  private sources = new Set<AudioBufferSourceNode>()
  private playHead = 0
  private capturing = false
  private closed = false

  private constructor(
    private readonly ctx: AudioContext,
    private readonly stream: MediaStream,
    private readonly handlers: LiveAudioHandlers
  ) {}

  /** Node perekam (AudioWorklet, atau ScriptProcessor sebagai cadangan); diputus saat close(). */
  private capture: AudioNode | null = null

  private onCapture(pcm: ArrayBuffer, rms: number) {
    if (!this.capturing || this.closed) return
    if (this.isPlaying() && rms < ECHO_GATE_RMS) return
    this.handlers.onChunk(toBase64(pcm))
  }

  /** Minta izin mikrofon dan siapkan audio. Panggil dari klik pengguna (kebijakan autoplay). */
  static async open(handlers: LiveAudioHandlers): Promise<LiveAudio> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    const ctx = new AudioContext()
    try {
      await ctx.resume()
      const audio = new LiveAudio(ctx, stream, handlers)
      const source = ctx.createMediaStreamSource(stream)
      const worklet = await loadWorklet(ctx)
      if (worklet) {
        worklet.port.onmessage = (event: MessageEvent<{ pcm: ArrayBuffer; rms: number }>) => audio.onCapture(event.data.pcm, event.data.rms)
        audio.capture = worklet
      } else {
        audio.capture = createScriptCapture(ctx, (pcm, rms) => audio.onCapture(pcm, rms))
      }
      source.connect(audio.capture)
      // Node perekam harus terhubung ke graph supaya berjalan; keluarannya hening.
      const mute = ctx.createGain()
      mute.gain.value = 0
      audio.capture.connect(mute).connect(ctx.destination)
      return audio
    } catch (error) {
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
      throw error
    }
  }

  /** Mulai/berhenti mengirim suara mikrofon (tombol mute, atau sebelum sesi siap). */
  setCapturing(on: boolean) {
    this.capturing = on
    this.stream.getAudioTracks().forEach((t) => (t.enabled = on))
  }

  isPlaying(): boolean {
    return this.sources.size > 0
  }

  /** Antrekan potongan audio jawaban (base64 PCM16 24 kHz). */
  enqueue(base64: string) {
    if (this.closed) return
    const pcm = fromBase64(base64)
    if (pcm.length === 0) return
    const buffer = this.ctx.createBuffer(1, pcm.length, OUTPUT_RATE)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 0x8000

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.ctx.destination)
    const startAt = Math.max(this.ctx.currentTime + 0.02, this.playHead)
    source.start(startAt)
    this.playHead = startAt + buffer.duration

    const wasIdle = this.sources.size === 0
    this.sources.add(source)
    source.onended = () => {
      this.sources.delete(source)
      if (this.sources.size === 0 && !this.closed) this.handlers.onPlayback(false)
    }
    if (wasIdle) this.handlers.onPlayback(true)
  }

  /** Hentikan audio yang belum terputar (pelanggan memotong pembicaraan). */
  clearPlayback() {
    const had = this.sources.size > 0
    for (const source of this.sources) {
      source.onended = null
      try {
        source.stop()
      } catch {
        // sudah berhenti
      }
    }
    this.sources.clear()
    this.playHead = this.ctx.currentTime
    if (had && !this.closed) this.handlers.onPlayback(false)
  }

  /** Tunggu sampai semua audio jawaban selesai diputar (maksimal maxMs). */
  async drain(maxMs = 15_000): Promise<void> {
    const until = Date.now() + maxMs
    while (this.isPlaying() && Date.now() < until && !this.closed) {
      await new Promise((r) => setTimeout(r, 150))
    }
  }

  close() {
    if (this.closed) return
    this.clearPlayback()
    this.closed = true
    this.capturing = false
    if (this.capture instanceof AudioWorkletNode) this.capture.port.onmessage = null
    if (this.capture instanceof ScriptProcessorNode) this.capture.onaudioprocess = null
    this.capture?.disconnect()
    this.stream.getTracks().forEach((t) => t.stop())
    void this.ctx.close()
  }
}
