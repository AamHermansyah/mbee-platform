import { vars } from "@/components/landing/parts"

/**
 * features-2x2 dalam dua layar (.g2): empat produk, tiap kartu dengan fragmen UI atau diagram di
 * panel berlatar painterly-landscape (card ground dealt, seed per panel). Kotak masuk & tiket
 * sudah tampil besar di #inbox. Satu loop di grup: kartu Voice AI.
 */


const SKY = '{"bg":"#c6d3df","surface":"#d6e0e9","ink":"#25303a","accent":"#3f6a92"}'
const SAND = '{"bg":"#d9ccb7","surface":"#e9e0d2","ink":"#2a2622","accent":"#a8794a"}'
const SAGE = '{"bg":"#cdd6c6","surface":"#dce3d6","ink":"#262d24","accent":"#6c8e63"}'
const PAINT = '{"blur":1,"brush":0.35,"slope":0,"hillY":0.3,"horizon":0.62,"drift":0}'

export function ProductsSection() {
  return (
    <section className="section g2" id="produk" aria-labelledby="produk-h">
      <div className="wrap">
        <div className="group">
          <div className="section-head">
            <h2 id="produk-h">
              Produk Mbee Platform. <span className="muted">Semuanya memakai data pelanggan yang sama.</span>
            </h2>
          </div>
          <div className="grid">
            <article className="card card--row card--open span-6" id="voice-ai">
              <h3>Menjawab telepon tanpa menu IVR</h3>
              <p>Agen Voice AI menerima dan menelepon pelanggan dengan suara yang terdengar seperti manusia.</p>
              <div className="panel" data-fx="painterly-landscape" data-fx-seed="31" data-fx-palette={SKY} data-fx-params={PAINT}>
                <div className="stage stage--fade-b">
                  <div className="at-rise to-edge fit" style={vars({ "--fit-max": "280px", "--ax": "max(24px, 50% - 140px)", "--ay": "32px", "--ay-sm": "16px" })}>
                    <div className="ui ui-panel ui-voice" data-ui="voice">
                      <div className="ui-voice__top">
                        <span className="ui-chip ui-chip--ink">Sedang menelepon</span>
                        <span className="ui-spacer" />
                        <span className="ui-voice__time" data-voice-time="">
                          01:12
                        </span>
                      </div>
                      <div className="ui-voice__orb" data-voice-orb="" />
                      <div className="ui-voice__who">
                        <span className="ui-voice__name">Mbee</span>
                        <span className="ui-voice__with">dengan Budi Santoso</span>
                      </div>
                      <div className="ui-voice__cap" data-voice-cap="">
                        Pesanan 12 kotak nasi untuk besok pukul 11.30 sudah saya catat, Pak.
                      </div>
                      <div className="ui-voice__bar">
                        <span className="ui-voice__btn" aria-hidden="true">
                          <svg className="ui-icon" viewBox="0 0 16 16">
                            <rect x="6" y="2" width="4" height="8" rx="2" />
                            <path d="M3.5 8a4.5 4.5 0 0 0 9 0M8 12.5V14" />
                          </svg>
                        </span>
                        <span className="ui-voice__wave" aria-hidden="true">
                          {[4, 7, 12, 9, 16, 11, 20, 14, 8, 17, 12, 6, 10, 18, 13, 7, 15, 9, 5, 11, 7, 4].map((h, i) => (
                            <i key={i} style={vars({ "--h": h })} />
                          ))}
                        </span>
                        <span className="ui-voice__btn ui-voice__end" aria-hidden="true">
                          <svg className="ui-icon" viewBox="0 0 16 16">
                            <path d="M2.2 9.6c3.4-2.6 8.2-2.6 11.6 0l-1.1 1.9-2.5-.9V8.9a7.5 7.5 0 0 0-4.4 0v1.7l-2.5.9z" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="card card--row card--open span-6" id="chatbot">
              <h3>Membalas chat sesuai konteks</h3>
              <p>Chatbot AI membaca riwayat pelanggan, lalu menjawab dan mengerjakan permintaannya di WhatsApp, Instagram, dan web.</p>
              <div className="panel" data-fx="painterly-landscape" data-fx-seed="47" data-fx-palette={SAND} data-fx-params={PAINT}>
                <div className="stage stage--fade-b">
                  <div className="at-rise fit" style={vars({ "--fit-max": "400px", "--ax": "max(24px, 50% - 200px)", "--ay": "48px", "--ay-sm": "16px" })} data-ui-loop="">
                    <div className="ui ui-panel ui-chat" data-ui="chat">
                      <div className="ui-head">
                        <span className="ui-agent" aria-hidden="true" />
                        <div className="ui-title">Mbee</div>
                        <span className="ui-chat__online">Online</span>
                        <span className="ui-spacer" />
                      </div>
                      <div className="ui-chat__body">
                        <div className="ui-chat__day">Instagram · Hari ini, 11.48</div>
                        <div className="ui-msg ui-msg--me" data-chat-q="">
                          <span className="ui-msg__text">Bisa pesan 2 kopi susu, saya ambil jam 12?</span>
                        </div>
                        <div className="ui-msg ui-msg--bot" data-chat-a="">
                          <span className="ui-agent ui-msg__av" aria-hidden="true" />
                          <span className="ui-msg__col">
                            <span className="ui-chat__answer">
                              Bisa, Kak. Pesanan <b>2 kopi susu</b> sudah tercatat dan siap diambil pukul 12.00.
                            </span>
                            <span className="ui-chat__srcs">
                              <span className="ui-chat__src">
                                <svg className="ui-icon" viewBox="0 0 16 16">
                                  <path d="M4 2.5h5l3 3v8H4z" />
                                  <path d="M9 2.5v3h3" />
                                </svg>
                                Pesanan #A-118
                              </span>
                              <span className="ui-chat__src">
                                <svg className="ui-icon" viewBox="0 0 16 16">
                                  <path d="M4 2.5h5l3 3v8H4z" />
                                  <path d="M9 2.5v3h3" />
                                </svg>
                                Menu hari ini
                              </span>
                            </span>
                          </span>
                        </div>
                        <div className="ui-msg ui-msg--me">
                          <span className="ui-msg__text">Mantap, nanti saya ambil, terima kasih!</span>
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
                </div>
              </div>
            </article>
          </div>
        </div>

        <div className="grid">
          <article className="card card--row card--open span-6" id="pesan-massal">
            <h3>Mengirim promo lewat WhatsApp dan SMS</h3>
            <p>Pesan massal memakai aturan rute dan mencatat status kirim tiap pesan.</p>
            <div className="panel" data-fx="painterly-landscape" data-fx-seed="58" data-fx-palette={SAGE} data-fx-params={PAINT}>
              <div className="stage stage--fade-b">
                <div className="at-rise fit" style={vars({ "--fit-max": "380px", "--ax": "32px", "--ay": "calc(100% - 180px)", "--ay-sm": "calc(100% - 180px)" })}>
                  <div className="ui ui-notify" data-ui="notify">
                    <ul className="ui-notify__list" data-notify-list="">
                      <li className="ui-note">
                        <span className="ui-agent ui-note__av" aria-hidden="true" />
                        <span className="ui-note__text">
                          <span className="ui-note__title">
                            Promo akhir bulan terkirim<time>baru</time>
                          </span>
                          <span className="ui-note__body">WhatsApp ke 1.240 pelanggan, 312 sudah dibaca</span>
                        </span>
                        <span className="ui-btn ui-btn--sm ui-note__btn">Lihat</span>
                      </li>
                      <li className="ui-note">
                        <span className="ui-avatar ui-note__av" data-tone="3">
                          SMS
                        </span>
                        <span className="ui-note__text">
                          <span className="ui-note__title">
                            SMS cadangan dikirim<time>4m</time>
                          </span>
                          <span className="ui-note__body">38 nomor tanpa WhatsApp menerima SMS</span>
                        </span>
                      </li>
                      <li className="ui-note">
                        <span className="ui-note__ico">
                          <svg className="ui-icon" viewBox="0 0 16 16">
                            <path d="m3.5 8.4 2.8 2.8 6.2-6.4" />
                          </svg>
                        </span>
                        <span className="ui-note__text">
                          <span className="ui-note__title">
                            Pengingat reservasi terkirim<time>12m</time>
                          </span>
                          <span className="ui-note__body">24 tamu untuk Sabtu malam</span>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="card card--row card--open span-6" id="backend">
            <h3>Mencatat pesanan dan tagihan</h3>
            <p>Pesanan, reservasi, tagihan, dan pembayaran tersimpan di sistem backend, terhubung ke percakapan yang memintanya.</p>
            <div className="panel" data-fx="painterly-landscape" data-fx-seed="64" data-fx-palette={SKY} data-fx-params={PAINT}>
              <div className="stage stage--fade-b">
                <div className="at-rise fit" style={vars({ "--fit-max": "340px", "--ax": "max(24px, 50% - 170px)", "--ay": "40px", "--ay-sm": "16px" })}>
                  <div className="ui ui-panel ui-checks" data-ui="checklist">
                    <div className="ui-checks__head">
                      <div className="ui-title">Sari Wulandari · #A-118</div>
                      <span className="ui-spacer" />
                      <div className="ui-meta" data-checks-count>
                        3 dari 4
                      </div>
                    </div>
                    <div className="ui-checks__bar">
                      <i data-checks-bar style={vars({ "--k": 0.75 })} />
                    </div>
                    <ul className="ui-checks__list">
                    <li className="ui-check is-done">
                      <span className="ui-check__box"><svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5" /></svg></span>
                      <span className="ui-check__label">Pesanan 2 kopi susu dari chat</span>
                    </li>
                    <li className="ui-check is-done">
                      <span className="ui-check__box"><svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5" /></svg></span>
                      <span className="ui-check__label">Reservasi Sabtu pukul 19.00</span>
                    </li>
                    <li className="ui-check is-done">
                      <span className="ui-check__box"><svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5" /></svg></span>
                      <span className="ui-check__label">Tagihan dikirim ke WhatsApp</span>
                    </li>
                    <li className="ui-check">
                      <span className="ui-check__box"><svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5" /></svg></span>
                      <span className="ui-check__label">Pembayaran QRIS diterima</span>
                    </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
