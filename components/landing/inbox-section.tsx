import { BrandMark } from "@/components/shared/brand"

/** app-frame: daftar percakapan semua kanal (fragmen window) di samping utas yang terbuka (fragmen chat). */

const ROWS: { initials: string; tone: number; who: string; sub: string; status: string; state?: "you" | "done"; age: string }[] = [
  { initials: "SW", tone: 1, who: "Sari Wulandari", sub: "WhatsApp · Meja untuk 4 orang jam 19.00", status: "Baru", age: "1m" },
  { initials: "BS", tone: 3, who: "Budi Santoso", sub: "Telepon · Pesan 12 kotak nasi untuk kantor", status: "Baru", age: "4m" },
  { initials: "PA", tone: 4, who: "Putri Ayu", sub: "Instagram · Promo kopi susu masih berlaku?", status: "Baru", age: "7m" },
  { initials: "RP", tone: 2, who: "Rizky Pratama", sub: "Email · Minta faktur bulan Oktober", status: "Perlu staf", state: "you", age: "12m" },
  { initials: "IP", tone: 5, who: "Intan Permata", sub: "Web · Jam buka saat hari libur", status: "Dibalas", state: "done", age: "18m" },
  { initials: "AS", tone: 3, who: "Agus Setiawan", sub: "WhatsApp · Ubah alamat antar", status: "Dibalas", state: "done", age: "25m" },
  { initials: "NR", tone: 1, who: "Nadia Rahma", sub: "Telepon · Batalkan reservasi Sabtu", status: "Dibalas", state: "done", age: "31m" },
  { initials: "WH", tone: 4, who: "Wahyu Hidayat", sub: "Instagram · Tanya lowongan barista", status: "Selesai", state: "done", age: "40m" },
  { initials: "DA", tone: 2, who: "Dimas Ardiansyah", sub: "WhatsApp · 2 kopi susu, ambil 12.00", status: "Selesai", state: "done", age: "52m" },
  { initials: "LK", tone: 5, who: "Lestari Kusuma", sub: "Web · Kue ulang tahun untuk Minggu", status: "Selesai", state: "done", age: "1j" },
]

function DocIcon() {
  return (
    <svg className="ui-icon" viewBox="0 0 16 16">
      <path d="M4 2.5h5l3 3v8H4z" />
      <path d="M9 2.5v3h3" />
    </svg>
  )
}

export function InboxSection() {
  return (
    <section className="section" id="inbox" aria-labelledby="inbox-h">
      <div className="wrap">
        <div className="grid grid--top">
          <h2 id="inbox-h" className="span-5">
            Satu kotak masuk untuk chat dan telepon
          </h2>
          <p className="span-6 start-7 t-lead mb-inbox__lead">
            Pesan WhatsApp, Instagram, email, web, dan ringkasan telepon masuk ke satu daftar. Tiap percakapan menyimpan
            riwayatnya, jadi agen AI dan staf melanjutkan dari titik yang sama.
          </p>
        </div>

        <div
          className="ui app fill"
          role="img"
          aria-label="Kotak masuk Mbee Cafe: sepuluh percakapan dari WhatsApp, telepon, Instagram, email, dan web, dengan utas Sari Wulandari terbuka di sampingnya"
          data-ui-pause-host=""
        >
          <div className="app__pane app__pane--list">
            <div className="ui ui-panel ui-win" data-ui="window" data-open="Baru" data-work="Diproses" data-done="Dibalas">
              <div className="ui-win__bar">
                <span className="ui-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="ui-win__crumb">
                  <BrandMark className="ui-brand" />
                  Mbee Cafe <i>/</i> <b>Kotak masuk</b>
                </span>
                <span className="ui-spacer" />
                <span className="ui-win__search" aria-hidden="true">
                  <svg className="ui-icon" viewBox="0 0 16 16">
                    <circle cx="7" cy="7" r="4.5" />
                    <path d="m10.5 10.5 3 3" />
                  </svg>
                  <span className="ui-win__ph">Cari</span>
                  <span className="ui-kbd">/</span>
                </span>
              </div>
              <div className="ui-win__body">
                <nav className="ui-win__side" aria-hidden="true">
                  <span className="ui-win__nav">
                    <svg className="ui-icon" viewBox="0 0 16 16">
                      <path d="M2.5 9h3l1 1.5h3l1-1.5h3" />
                      <path d="M2.5 9 4 3.5h8L13.5 9v3.5h-11z" />
                    </svg>
                    Semua<em>24</em>
                  </span>
                  <span className="ui-win__nav">
                    <svg className="ui-icon" viewBox="0 0 16 16">
                      <circle cx="8" cy="6" r="2.5" />
                      <path d="M3.5 13.5c.6-2.3 2.4-3.5 4.5-3.5s3.9 1.2 4.5 3.5" />
                    </svg>
                    Milik saya<em>6</em>
                  </span>
                  <span className="ui-win__nav">
                    <svg className="ui-icon" viewBox="0 0 16 16">
                      <circle cx="8" cy="8" r="5.5" />
                      <path d="M8 5v3l2 1.5" />
                    </svg>
                    Menunggu<em>3</em>
                  </span>
                  <span className="ui-win__nav">
                    <svg className="ui-icon" viewBox="0 0 16 16">
                      <path d="m3.5 8.4 2.8 2.8 6.2-6.4" />
                    </svg>
                    Selesai
                  </span>
                  <span className="ui-win__label">Kanal</span>
                  {["WhatsApp", "Instagram", "Email", "Web", "Telepon"].map((channel) => (
                    <span className="ui-win__nav" key={channel}>
                      <span className="ui-win__hash">#</span>
                      {channel}
                    </span>
                  ))}
                </nav>
                <div className="ui-win__main">
                  <div className="ui-win__cols" aria-hidden="true">
                    <span>Pelanggan</span>
                    <span>Percakapan</span>
                    <span>Status</span>
                    <span>Waktu</span>
                  </div>
                  <ul className="ui-win__rows">
                    {ROWS.map((row) => (
                      <li className="ui-win__row" data-row="" key={row.who}>
                        <span className="ui-avatar" data-tone={row.tone}>
                          {row.initials}
                        </span>
                        <span className="ui-win__who">{row.who}</span>
                        <span className="ui-win__sub">{row.sub}</span>
                        <span
                          className={`ui-win__st${row.state === "you" ? " is-you" : row.state === "done" ? " is-done" : ""}`}
                          data-st=""
                        >
                          {row.status}
                        </span>
                        <span className="ui-win__age">{row.age}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="app__pane app__pane--open" data-ui-loop="">
            <div className="ui ui-panel ui-chat" data-ui="chat">
              <div className="ui-head">
                <span className="ui-agent" aria-hidden="true" />
                <div className="ui-title">Sari Wulandari</div>
                <span className="ui-chat__online">Dilayani Mbee</span>
                <span className="ui-spacer" />
              </div>
              <div className="ui-chat__body">
                <div className="ui-chat__day">WhatsApp · Hari ini, 17.41</div>
                <div className="ui-msg ui-msg--me" data-chat-q="">
                  <span className="ui-msg__text">Masih ada meja untuk 4 orang jam 7 malam?</span>
                </div>
                <div className="ui-msg ui-msg--bot" data-chat-a="">
                  <span className="ui-agent ui-msg__av" aria-hidden="true" />
                  <span className="ui-msg__col">
                    <span className="ui-chat__answer">
                      Ada, Kak. Meja untuk 4 orang pukul <b>19.00</b> sudah saya catat atas nama Sari.
                    </span>
                    <span className="ui-chat__srcs">
                      <span className="ui-chat__src">
                        <DocIcon />
                        Reservasi #R-0412
                      </span>
                      <span className="ui-chat__src">
                        <DocIcon />
                        Denah meja
                      </span>
                    </span>
                  </span>
                </div>
                <div className="ui-chat__day">Telepon · 18.02 · 1 menit 40 detik</div>
                <div className="ui-msg ui-msg--me">
                  <span className="ui-msg__text">Saya telat sedikit, mejanya masih aman?</span>
                </div>
                <div className="ui-msg ui-msg--bot">
                  <span className="ui-agent ui-msg__av" aria-hidden="true" />
                  <span className="ui-msg__col">
                    <span className="ui-chat__answer">Aman, Kak. Meja ditahan sampai 19.30 dan catatannya masuk ke reservasi yang sama.</span>
                  </span>
                </div>
                <div className="ui-msg ui-msg--me">
                  <span className="ui-msg__text">Sip, terima kasih banyak ya, Kak!</span>
                </div>
                <div className="ui-msg ui-msg--bot">
                  <span className="ui-agent ui-msg__av" aria-hidden="true" />
                  <span className="ui-msg__col">
                    <span className="ui-chat__answer">Sama-sama, Kak Sari. Sampai jumpa nanti malam.</span>
                  </span>
                </div>
                <div className="ui-chat__day">Tiket ditutup otomatis · 18.04</div>
              </div>
              <div className="ui-chat__input">
                <span className="ui-chat__ph">Tulis balasan</span>
                <span className="ui-chat__send" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="14" height="14">
                    <path d="M8 13V3.5M3.8 7.5 8 3.3l4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
