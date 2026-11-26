/**
 * Jangkauan dan mitra: teks di kiri, diagram hub dengan ikon asli mitra di kanan (span-6 start-7),
 * lalu baris angka dari brief sebagai momen counter-rolls (dealt). Ground: bg-band (dealt).
 */

const HUB = {
  layout: "hub",
  alt: "Mbee Platform terhubung ke WhatsApp, Meta, OpenAI, Gemini, dan Anthropic.",
  center: { label: "Mbee Platform", icon: "ui:audio-lines" },
  spokes: [
    { label: "WhatsApp", icon: "whatsapp" },
    { label: "Meta", icon: "meta" },
    { label: "OpenAI", icon: "openai" },
    { label: "Gemini", icon: "gemini" },
    { label: "Anthropic", icon: "anthropic" },
  ],
}

const FIGURES: { value: string; label: string }[] = [
  { value: "50.000+", label: "bisnis aktif memakai Mbee Platform" },
  { value: "6", label: "negara, dari Singapura dan Indonesia sampai Malaysia" },
  { value: "50+", label: "kota di Indonesia" },
  { value: "20", label: "provinsi di Indonesia" },
]

export function ReachSection() {
  return (
    <section className="section bg-band" id="jangkauan" aria-labelledby="jangkauan-h">
      <div className="wrap">
        <div className="grid grid--top">
          <div className="span-5 section-head mb-reach__head">
            <h2 id="jangkauan-h">Mbee Platform di Asia Tenggara</h2>
            <p>
              Terhubung ke WhatsApp, Meta, OpenAI, Gemini, dan Anthropic, memahami lebih dari 80 bahasa, dan tersambung ke
              operator telekomunikasi lokal di tiap negara.
            </p>
          </div>
          <div className="frame frame--split span-6 start-7 mb-reach__visual">
            <div className="dg" data-diagram={JSON.stringify(HUB)} />
          </div>
        </div>
        <div className="grid mb-reach__figures" data-moment="counter-rolls">
          {FIGURES.map((figure) => (
            <div className="span-3" key={figure.value}>
              <p className="t-stat">{figure.value}</p>
              <p className="t-small muted">{figure.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
