import { LogoLink, VoiceButton } from "@/components/landing/parts"

/** nav-mega (dealt): satu bilah tetap; "Produk" membuka panel kolom tautan dan satu kartu menu. */
export function SiteNav() {
  return (
    <header className="nav">
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">
          Langsung ke isi
        </a>
        <LogoLink />
        <nav className="nav__links" aria-label="Utama">
          <div className="nav__item">
            <a className="nav__link" href="#produk">
              Produk{" "}
              <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <div className="nav__menu">
              <div className="wrap grid">
                <div className="menu-col span-3">
                  <p className="t-label">Percakapan</p>
                  <a href="#voice-ai">
                    Agen Voice AI<span>Telepon masuk dan keluar</span>
                  </a>
                  <a href="#chatbot">
                    Chatbot AI<span>WhatsApp, Instagram, dan web</span>
                  </a>
                </div>
                <div className="menu-col span-3">
                  <p className="t-label">Operasional</p>
                  <a href="#inbox">
                    Kotak masuk dan tiket<span>Semua kanal di satu daftar</span>
                  </a>
                  <a href="#pesan-massal">
                    Pesan massal<span>Promo lewat WhatsApp dan SMS</span>
                  </a>
                  <a href="#backend">
                    Sistem backend<span>Pesanan, reservasi, tagihan</span>
                  </a>
                </div>
                <a className="menu-card span-3 start-10" href="#alur">
                  <div className="panel mb-menu-panel">
                    <div className="stage stage--fade-br">
                      <div className="at-corner" style={{ ["--ax" as string]: "24px", ["--ay" as string]: "24px" }}>
                        <div className="ui ui-panel ui-checks" data-ui="checklist" data-ui-still="">
                          <div className="ui-checks__head">
                            <div className="ui-title">Onboarding Mbee Cafe</div>
                            <span className="ui-spacer" />
                            <div className="ui-meta" data-checks-count>
                              3 dari 4
                            </div>
                          </div>
                          <div className="ui-checks__bar">
                            <i data-checks-bar style={{ ["--k" as string]: 0.75 }} />
                          </div>
                          <ul className="ui-checks__list">
                            <li className="ui-check is-done"><span className="ui-check__box"><svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5" /></svg></span><span className="ui-check__label">Kebutuhan dicatat</span></li>
                            <li className="ui-check is-done"><span className="ui-check__box"><svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5" /></svg></span><span className="ui-check__label">Paket Starter dipilih</span></li>
                            <li className="ui-check is-done"><span className="ui-check__box"><svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5" /></svg></span><span className="ui-check__label">Pembayaran lunas</span></li>
                            <li className="ui-check"><span className="ui-check__box"><svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5" /></svg></span><span className="ui-check__label">Akun dibuat</span></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="t-card">Onboarding lewat Voice AI</span>
                  <span className="t-small muted">Mbee membuatkan akun Anda</span>
                </a>
              </div>
            </div>
          </div>
          <div className="nav__item">
            <a className="nav__link" href="#alur">
              Alur
            </a>
          </div>
          <div className="nav__item">
            <a className="nav__link" href="#industri">
              Industri
            </a>
          </div>
          <div className="nav__item">
            <a className="nav__link" href="#faq">
              Pertanyaan
            </a>
          </div>
        </nav>
        <div className="nav__actions">
          <a className="nav__link" href="/login">
            Masuk
          </a>
          <VoiceButton />
        </div>
        <button className="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}
