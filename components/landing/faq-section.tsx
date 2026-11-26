/** faq: semua jawaban terbuka, tanpa akordeon. Ground dealt: bg-mist. */

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "Perlu daftar dulu sebelum bicara dengan Mbee?",
    a: "Tidak. Ceritakan kebutuhan usaha Anda, pilih paket, lalu bayar di jendela yang sama. Akun dibuat setelah pembayaran lunas.",
  },
  {
    q: "Berapa harga paket Mbee Platform?",
    a: "Seed, Starter, dan Growth dibayar bulanan; Mbee menyebutkan harga tiap paket saat Anda bicara. Harga Enterprise disampaikan tim sales.",
  },
  {
    q: "Saya belum punya WhatsApp Business API. Bisa?",
    a: "Bisa. Tim teknis mendampingi verifikasinya sampai selesai dan menghubungi Anda lewat WhatsApp dalam 1×24 jam setelah pembayaran.",
  },
  {
    q: "Kapan pelanggan dilayani staf?",
    a: "Saat pelanggan meminta, atau saat Mbee tidak bisa menyelesaikannya. Staf menerima percakapan beserta ringkasannya.",
  },
  {
    q: "Apakah data pelanggan aman?",
    a: "Mbee Platform bersertifikat ISO 27001 dan mengikuti aturan perlindungan data di tiap negara tempat layanan berjalan.",
  },
]

export function FaqSection() {
  return (
    <section className="section bg-mist" id="faq" aria-labelledby="faq-h">
      <div className="wrap">
        <div className="grid grid--top">
          <div className="span-5">
            <div className="section-head mb-faq__head">
              <h2 id="faq-h">Pertanyaan tentang Mbee Platform</h2>
              <p>Mbee juga menjawab pertanyaan lain saat Anda bicara.</p>
              <p>
                <a className="link" href="mailto:halo@mbee.example">
                  Kirim email ke tim
                </a>
              </p>
            </div>
            <div
              className="frame frame--lit mb-faq__visual"
              role="img"
              aria-label="Mbee menjawab pertanyaan tentang pembayaran yang gagal saat panggilan berlangsung"
            >
              <div className="mb-card" aria-hidden="true">
                <div className="mb-chat mb-card__body">
                  <div className="mb-msg mb-msg--user">
                    <small>Pelanggan · 10.06</small>
                    <p>Kalau pembayarannya gagal bagaimana?</p>
                  </div>
                  <div className="mb-msg">
                    <small>Mbee · 10.06</small>
                    <p>Tidak ada dana yang terpotong, Kak. Jendela pembayaran bisa dibuka lagi dengan metode lain.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="faq span-6 start-7">
            {QUESTIONS.map((item) => (
              <div className="faq__item" key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
