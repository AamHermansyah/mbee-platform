import { BrandMark } from "@/components/shared/brand"

/**
 * Momen dealt: pinned-chapters. Tiga langkah sesi Voice AI di landing ini (lib/voice/demo-script.ts),
 * tiap langkah dengan satu layar UI di bingkai bersama.
 */

function Bubble({ who, time, text, user = false }: { who: string; time: string; text: string; user?: boolean }) {
  return (
    <div className={`mb-msg${user ? " mb-msg--user" : ""}`}>
      <small>
        {who} · {time}
      </small>
      <p>{text}</p>
    </div>
  )
}

export function JourneySection() {
  return (
    <section className="section" id="alur" style={{ ["--h" as string]: 2 }} data-moment="pinned-chapters" aria-labelledby="alur-h">
      <div className="wrap mo-pc__grid">
        <div className="mo-pc__text">
          <h2 id="alur-h">Dari keluhan sampai akun aktif bersama Mbee</h2>
          <ol className="mo-pc__steps">
            <li className="mo-pc__step">
              <h3>Ceritakan kendala usaha ke Mbee</h3>
              <p>
                Mbee bertanya apa yang paling merepotkan, misalnya chat WhatsApp yang menumpuk saat makan siang, lalu
                mencatatnya di tiket.
              </p>
              <figure className="mo-pc__visual mo-pc__visual--lit" role="img" aria-label="Transkrip: pemilik kafe bercerita chat WhatsApp menumpuk, Mbee mencatatnya di tiket">
                <div className="mb-card" aria-hidden="true">
                  <div className="mb-card__head">
                    <BrandMark className="mb-card__mark" />
                    <b>Mbee · Voice AI</b>
                    <span className="mb-chip mb-chip--live">Sedang bicara</span>
                  </div>
                  <div className="mb-card__body mb-chat">
                    <Bubble who="Mbee" time="10.02" text="Ceritakan saja kendala usaha Anda. Tidak perlu daftar dulu." />
                    <Bubble
                      who="Pelanggan"
                      time="10.02"
                      user
                      text="Chat WhatsApp pelanggan sering menumpuk di jam makan siang, kadang telat kami balas."
                    />
                    <div className="mb-line mb-line--note">
                      <i>✓</i>
                      <span>
                        Tiket <b>TKT-20261126-001</b>: keluhan dicatat
                      </span>
                    </div>
                  </div>
                </div>
              </figure>
            </li>
            <li className="mo-pc__step">
              <h3>Pilih paket yang disarankan Mbee</h3>
              <p>Mbee menyarankan paket yang cocok dan menampilkan pilihannya di layar. Anda yang memutuskan.</p>
              <figure className="mo-pc__visual mo-pc__visual--lit" role="img" aria-label="Pilihan paket di layar: Starter disarankan, lalu Seed, Growth, dan Enterprise">
                <div className="mb-card" aria-hidden="true">
                  <div className="mb-card__head">
                    <b>Pilih paket</b>
                    <span className="mb-card__meta">Paket layanan mana yang ingin diaktifkan?</span>
                  </div>
                  <ul className="mb-options">
                    <li className="is-on">
                      <b>Starter (disarankan)</b>
                      <span>5 kursi · 3 saluran · 3.000 MAU</span>
                    </li>
                    <li>
                      <b>Seed</b>
                      <span>2 kursi · 1 saluran · 500 MAU</span>
                    </li>
                    <li>
                      <b>Growth</b>
                      <span>10 kursi · semua saluran standar · 10.000 MAU</span>
                    </li>
                    <li>
                      <b>Enterprise</b>
                      <span>Disesuaikan, dihubungi tim sales</span>
                    </li>
                  </ul>
                </div>
              </figure>
            </li>
            <li className="mo-pc__step">
              <h3>Bayar, lalu masuk ke Mbee Platform</h3>
              <p>
                Jendela pembayaran terbuka di samping percakapan. Setelah lunas, Mbee membuatkan akun dan mengirim kata
                sandi sementara ke email Anda.
              </p>
              <figure className="mo-pc__visual mo-pc__visual--lit" role="img" aria-label="Akun Mbee Cafe aktif dengan kata sandi sementara yang dikirim ke email">
                <div className="mb-card" aria-hidden="true">
                  <div className="mb-card__head">
                    <BrandMark className="mb-card__mark" />
                    <b>Akun Mbee Cafe aktif</b>
                    <span className="mb-chip mb-chip--ok">Lunas</span>
                  </div>
                  <dl className="mb-account">
                    <dt>Paket</dt>
                    <dd>Starter, bulanan</dd>
                    <dt>Kata sandi sementara</dt>
                    <dd className="mb-account__secret">••••••••••</dd>
                    <dt>Detail masuk</dt>
                    <dd>Dikirim ke email Anda</dd>
                  </dl>
                  <span className="mb-pay__btn mb-pay__btn--wide">Masuk ke dashboard</span>
                </div>
              </figure>
            </li>
          </ol>
        </div>
        <div className="mo-pc__visuals frame" />
      </div>
    </section>
  )
}
