import { VoiceButton } from "@/components/landing/parts"
import { BrandMark } from "@/components/shared/brand"

/**
 * Hero dealt: collage. Teks span-5; di kanan bingkai berwarna (efek gradient-mesh) berisi jendela
 * percakapan Voice AI Mbee dengan pemilik kafe, dan satu kartu tiket kecil yang terisi sampai lunas
 * (loop tiga langkah dari layout.js).
 */
export function Hero() {
  return (
    <section className="hero hero--collage" data-enter="" aria-labelledby="hero-h">
      <div className="wrap">
        <div className="hero-text grid hero__grid">
          <div className="hero__text span-5">
            <h1 id="hero-h">Chatbot dan Voice AI untuk layanan pelanggan</h1>
            <p className="hero__lead">
              Mbee Platform menjawab chat dan telepon pelanggan Anda 24 jam, mencatat tiap permintaan sebagai tiket, dan
              meneruskannya ke staf saat dibutuhkan.
            </p>
            <div className="btn-row">
              <VoiceButton />
              <a className="btn btn--secondary" href="/login">
                Masuk
              </a>
            </div>
            <p className="hero__proof">Tidak perlu daftar dulu, Mbee membuatkan akun setelah paket Anda dibayar.</p>
          </div>

          <div
            className="hero__art span-6 start-7"
            role="img"
            aria-label="Mbee, asisten Voice AI, berbicara dengan pemilik kafe dan menyarankan paket Starter, sementara tiket onboarding terisi sampai pembayaran lunas"
            data-fx="gradient-mesh"
            data-fx-seed="1126"
            data-fx-params='{"calmX":0.3,"calmY":0.6}'
          >
            <div className="ly-piece ly-piece--main mb-win" aria-hidden="true">
              <div className="mb-win__bar">
                <span className="mb-win__dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="mb-win__crumb">
                  <BrandMark className="mb-win__mark" />
                  Mbee <i>·</i> <b>Voice AI</b>
                </span>
                <span className="mb-chip mb-chip--live">Sedang bicara</span>
                <span className="mb-win__time">02:14</span>
              </div>
              <div className="mb-win__body">
                <div className="mb-call">
                  <span className="mb-call__avatar">
                    <BrandMark className="mb-call__mark" />
                  </span>
                  <b>Mbee</b>
                  <small>Asisten Voice AI</small>
                  <span className="mb-wave">
                    {[6, 11, 16, 9, 18, 12, 7, 14, 10, 5].map((h, i) => (
                      <i key={i} style={{ height: `${h}px` }} />
                    ))}
                  </span>
                  <span className="mb-call__btns">
                    <span className="mb-btn">Bisukan</span>
                    <span className="mb-btn mb-btn--end">Akhiri</span>
                  </span>
                </div>
                <div className="mb-chat">
                  <div className="mb-msg">
                    <small>Mbee · 10.02</small>
                    <p>Halo, selamat datang di Mbee Platform! Ceritakan saja kendala usaha Anda.</p>
                  </div>
                  <div className="mb-msg mb-msg--user">
                    <small>Pelanggan · 10.02</small>
                    <p>Saya punya kafe. Chat WhatsApp pelanggan sering menumpuk di jam makan siang.</p>
                  </div>
                  <div className="mb-msg">
                    <small>Mbee · 10.03</small>
                    <p>Untuk chatbot menu dan pesanan dari chat, saya sarankan paket Starter.</p>
                    <span className="mb-plan">
                      <b>Starter</b>
                      <span>5 kursi · 3 saluran · 3.000 MAU</span>
                    </span>
                  </div>
                  <div className="mb-msg mb-msg--user">
                    <small>Pelanggan · 10.03</small>
                    <p>Boleh, langsung aktifkan saja ya.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="ly-piece ly-piece--note mb-ticket" aria-hidden="true" data-ly-steps="700">
              <div className="mb-ticket__row">
                <span className="mb-ticket__id">TKT-20261126-001</span>
                <span className="mb-chip mb-chip--ok" data-step="" data-step-at="3">
                  Lunas
                </span>
              </div>
              <h5>Onboarding · Mbee Cafe</h5>
              <div className="mb-line" data-step="">
                <i>✓</i>
                <span>
                  Kebutuhan: <b>balas chat dan pesanan</b>
                </span>
              </div>
              <div className="mb-line" data-step="">
                <i>✓</i>
                <span>
                  Paket <b>Starter</b> dipilih
                </span>
              </div>
              <div className="mb-line" data-step="">
                <i>✓</i>
                <span>
                  Pembayaran <b>QRIS</b> lunas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
