/**
 * tabs-tour (software, klik saja, tidak pernah berganti sendiri): empat industri dari brief.
 * Tiap tab mengendalikan teksnya dan satu layar chat di bingkai kanan (system.js).
 */

type Industry = {
  id: string
  tab: string
  name: string
  text: string
  channel: string
  question: string
  answer: string
  sources: [string, string]
  thanks: string
}

const INDUSTRIES: Industry[] = [
  {
    id: "bank",
    tab: "Bank",
    name: "bank dan keuangan",
    text: "Calon nasabah dijawab dalam hitungan detik dan dipandu sampai onboarding digital selesai. Staf menerima ringkasan percakapan, dan penagihan berjalan sesuai aturan.",
    channel: "WhatsApp · 09.12",
    question: "Saya mau buka rekening tabungan. Syaratnya apa saja?",
    answer: "Cukup KTP dan swafoto, Pak. Tautan pembukaan rekening sudah saya kirim ke chat ini.",
    sources: ["Onboarding digital", "Syarat rekening"],
    thanks: "Oke, formulirnya saya isi sekarang.",
  },
  {
    id: "klinik",
    tab: "Klinik",
    name: "rumah sakit dan klinik",
    text: "Pasien membuat dan mengubah janji lewat chat atau telepon. Pengingat otomatis mengurangi janji yang terlewat, dan kasus yang perlu perawat diteruskan ke staf.",
    channel: "Telepon · 14.30",
    question: "Bisa pindah jadwal kontrol ke Kamis sore?",
    answer: "Bisa, Bu. Jadwal kontrol pindah ke Kamis pukul 16.00, pengingatnya dikirim sehari sebelumnya.",
    sources: ["Jadwal dokter", "Janji #J-2207"],
    thanks: "Baik, terima kasih sudah diingatkan.",
  },
  {
    id: "properti",
    tab: "Properti",
    name: "properti",
    text: "Prospek disaring lebih cepat, AI menjelaskan unit yang ditanyakan, lalu kunjungan dan tindak lanjutnya dijadwalkan otomatis.",
    channel: "Instagram · 19.48",
    question: "Unit dua kamar di tower B masih ada?",
    answer: "Masih ada tiga unit, Kak. Mau saya jadwalkan kunjungan Sabtu pukul 10.00?",
    sources: ["Daftar unit", "Jadwal kunjungan"],
    thanks: "Boleh, Sabtu jam 10 saya datang.",
  },
  {
    id: "hotel",
    tab: "Hotel",
    name: "hotel",
    text: "Tamu langsung mendapat jawaban dan reservasi, concierge AI melayani permintaan selama menginap, dan tiap permintaan sampai ke bagian hotel yang tepat.",
    channel: "Web · 21.05",
    question: "Bisa minta handuk tambahan ke kamar 412?",
    answer: "Bisa, Bu. Permintaan sudah diteruskan ke housekeeping dan tercatat sebagai tiket.",
    sources: ["Tiket #H-0931", "Housekeeping"],
    thanks: "Terima kasih banyak, ditunggu ya.",
  },
]

function DocIcon() {
  return (
    <svg className="ui-icon" viewBox="0 0 16 16">
      <path d="M4 2.5h5l3 3v8H4z" />
      <path d="M9 2.5v3h3" />
    </svg>
  )
}

export function IndustriesSection() {
  return (
    <section className="section" id="industri" aria-labelledby="industri-h">
      <div className="wrap">
        <div className="grid grid--top fill">
          <div className="span-5 mb-tour">
            <div className="section-head">
              <h2 id="industri-h">Layanan pelanggan untuk bank, klinik, properti, dan hotel</h2>
            </div>
            <div className="tabs" role="tablist" aria-label="Industri">
              {INDUSTRIES.map((industry, i) => (
                <button
                  key={industry.id}
                  className="tab"
                  type="button"
                  role="tab"
                  id={`tab-btn-${industry.id}`}
                  aria-selected={i === 0}
                  aria-controls={`tab-${industry.id} screen-${industry.id}`}
                >
                  {industry.tab}
                </button>
              ))}
            </div>
            {INDUSTRIES.map((industry, i) => (
              <div
                key={industry.id}
                className="mb-tour__panel"
                role="tabpanel"
                id={`tab-${industry.id}`}
                aria-labelledby={`tab-btn-${industry.id}`}
                hidden={i !== 0}
              >
                <p>{industry.text}</p>
              </div>
            ))}
          </div>

          <div className="frame frame--split frame--fill span-6 start-7 mb-tour__frame">
            <div className="stage stage--fade-b" data-ui-loop="">
              {INDUSTRIES.map((industry, i) => (
                <div
                  key={industry.id}
                  id={`screen-${industry.id}`}
                  className="at-rise to-edge fit"
                  style={{ ["--fit-max" as string]: "420px", ["--ax" as string]: "max(24px, 50% - 210px)", ["--ay" as string]: "56px", ["--ay-sm" as string]: "16px" }}
                  role="img"
                  aria-label={`Contoh percakapan ${industry.name}: ${industry.question}`}
                  hidden={i !== 0}
                >
                  <div className="ui ui-panel ui-chat" data-ui="chat" aria-hidden="true">
                    <div className="ui-head">
                      <span className="ui-agent" aria-hidden="true" />
                      <div className="ui-title">Mbee</div>
                      <span className="ui-chat__online">Online</span>
                      <span className="ui-spacer" />
                    </div>
                    <div className="ui-chat__body">
                      <div className="ui-chat__day">{industry.channel}</div>
                      <div className="ui-msg ui-msg--me" data-chat-q="">
                        <span className="ui-msg__text">{industry.question}</span>
                      </div>
                      <div className="ui-msg ui-msg--bot" data-chat-a="">
                        <span className="ui-agent ui-msg__av" aria-hidden="true" />
                        <span className="ui-msg__col">
                          <span className="ui-chat__answer">{industry.answer}</span>
                          <span className="ui-chat__srcs">
                            {industry.sources.map((source) => (
                              <span className="ui-chat__src" key={source}>
                                <DocIcon />
                                {source}
                              </span>
                            ))}
                          </span>
                        </span>
                      </div>
                      <div className="ui-msg ui-msg--me">
                        <span className="ui-msg__text">{industry.thanks}</span>
                      </div>
                    </div>
                    <div className="ui-chat__input">
                      <span className="ui-chat__ph">Tulis pesan</span>
                      <span className="ui-chat__send" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="14" height="14">
                          <path d="M8 13V3.5M3.8 7.5 8 3.3l4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
