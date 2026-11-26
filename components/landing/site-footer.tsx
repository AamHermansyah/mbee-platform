import { LogoLink, VoiceButton } from "@/components/landing/parts"

/**
 * footer.closing dealt: footer-statement (lempeng di lit ground) dengan close-word: h2 dan tombol aksi
 * utama, lalu nama diset selebar .wrap; baris kedua kolom tautan dan baris legal.
 * Kontak: email .example sebagai pengganti sampai alamat asli diberikan; kota saja (house rule 9).
 */

const SERVICES = [
  "Implementasi",
  "Desain dan konfigurasi solusi",
  "Layanan integrasi",
  "Paket dukungan",
  "Aktivasi WhatsApp Business Platform",
]

const SOLUTIONS = ["Bank dan keuangan", "Rumah sakit dan klinik", "Properti", "Hotel"]

export function SiteFooter() {
  return (
    <footer className="footer closing footer--statement" id="contact" aria-labelledby="close-h">
      <div className="wrap">
        <div className="closing__cta close--word">
          <div className="section-head--split mb-close__head">
            <div>
              <h2 id="close-h">Ceritakan kebutuhan usaha Anda ke Mbee</h2>
              <p className="t-lead">Mbee mendengar 24 jam dan membantu Anda memilih paket.</p>
            </div>
            <VoiceButton />
          </div>
          <p className="close__word" aria-hidden="true">
            mbee platform
          </p>
        </div>

        <div className="closing__links">
          <div className="grid">
            <div className="span-4 stack-4">
              <LogoLink />
              <p className="footer__lede">Percakapan pelanggan dari pesan pertama sampai selesai.</p>
            </div>
            <div className="span-2 footer__col">
              <h3>Produk</h3>
              <ul>
                <li>
                  <a href="#voice-ai">Agen Voice AI</a>
                </li>
                <li>
                  <a href="#chatbot">Chatbot AI</a>
                </li>
                <li>
                  <a href="#inbox">Kotak masuk dan tiket</a>
                </li>
                <li>
                  <a href="#pesan-massal">Pesan massal</a>
                </li>
                <li>
                  <a href="#backend">Sistem backend</a>
                </li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>Layanan</h3>
              <ul>
                {SERVICES.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>Solusi</h3>
              <ul>
                {SOLUTIONS.map((solution) => (
                  <li key={solution}>{solution}</li>
                ))}
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>Kontak</h3>
              <ul>
                <li>
                  <a href="mailto:halo@mbee.example">Kirim email ke tim</a>
                </li>
                <li>
                  <a href="/login">Masuk</a>
                </li>
                <li>Kantor di Jakarta</li>
              </ul>
            </div>
          </div>
          <div className="footer__legal">
            <span>© 2026 Mbee Platform</span>
            <span>Nama produk dan logo pihak lain adalah merek dagang pemiliknya.</span>
            <div className="socials" />
          </div>
        </div>
      </div>
    </footer>
  )
}
