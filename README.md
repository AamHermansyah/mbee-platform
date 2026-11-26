# Mbee Platform × Mbee Cafe: Customer Journey dengan Voice AI

Demo lomba build AI (tema Customer Journey). Mbee Cafe (klien retail, "mbee" = suara domba) bertemu **Mbee**,
asisten Voice AI **Mbee Platform**. Calon klien **tidak perlu login dulu** untuk berdiskusi:
- Mbee mendengarkan keluhan dan keinginannya.
- Mbee merekomendasikan **paket layanan bundling**.
- Mbee membantu **pembayaran**, lalu sistem membuatkan **akun dengan kata sandi sementara** yang wajib diganti saat pertama masuk.

Tim internal Mbee Platform memantau tiketnya secara live di kanban.

Tampilan dashboard mengikuti pola platform asli tim (`mimin-workflow`), tetapi nama platform di UI adalah Mbee Platform.

**Tahap 1:** UI + data mock dengan naskah simulasi.
**Tahap 2:** Mbee berbicara sungguhan lewat **Gemini Live** (suara ke suara, voice AI dari proyek tim "WebRTC Avatar Revised"),
dengan popup koreksi, pilih paket, pembayaran, dan akun yang sama seperti tahap 1. Naskah simulasi tetap ada sebagai cadangan.
Konteks lengkap keputusan dan riwayat diskusi ada di [`.context/README.md`](.context/README.md).

## Menjalankan

```bash
cp .env.example .env.local   # isi DATABASE_URL (Supabase) dan GEMINI_API_KEY (+ SMTP bila ingin email kredensial terkirim)
npm install
npm run dev     # http://localhost:3000
npm run build   # font disimpan lokal, build tidak butuh internet
```

Proyek memakai **npm** (`package-lock.json`) supaya deploy ke Vercel langsung jalan.
Di Vercel, isi variabel yang sama dengan `.env.example` di *Settings → Environment Variables*.

Bila `npm install` gagal dengan `EALLOWREMOTE`, konfigurasi npm di mesin itu membatasi dependensi tarball
(opsional dari Tailwind); jalankan `npm install --allow-remote=all`.

### Voice AI (Gemini Live)

- Browser terhubung **langsung** ke Gemini Live lewat WebSocket memakai token sementara sekali pakai dari
  `POST /api/voice/session`. `GEMINI_API_KEY` hanya ada di server.
- Mikrofon wajib diizinkan. Di luar `localhost` wajib **HTTPS** (Vercel sudah HTTPS).
- Model dan suara mengikuti proyek "WebRTC Avatar Revised": `gemini-3.8-live`, suara `Puck`, bahasa `id-ID`.
  Mbee selalu berbahasa Indonesia.
- Knowledge `lib/voice/live/knowledge/*.md` (dibaca ulang setiap sesi baru) sudah disesuaikan dengan kasus demo:
  lewat Mbee tanpa daftar dan akun dibuat setelah lunas; trial 9 hari hanya untuk daftar sendiri di platform tanpa pembelian; metode bayar di dialog, aturan upgrade, menu dashboard, dan fitur untuk kafe.
- Mode percakapan dipilih di menu tabung (⚗) widget: **Live AI** (bawaan) atau **Simulasi naskah** (cadangan bila internet/kuota bermasalah).
- Setelah pembayaran lunas di landing, email kredensial akun dikirim lewat SMTP (`POST /api/voice/email`).
  `EMAIL_DRY_RUN=1` untuk uji tanpa mengirim.

## Rute

| Rute | Isi |
|---|---|
| `/` | Landing publik **mbee.io** + widget Voice AI kanan bawah (tanpa login) |
| `/login` | Masuk. `?email=` terisi otomatis dari tombol *Masuk ke Dashboard* di kartu akun Voice AI |
| `/new-password` | Ganti kata sandi wajib untuk akun yang masih memakai kata sandi sementara |
| `/dashboard` | Diarahkan sesuai peran |
| `/dashboard/get-started` | Halaman Mulai klien, salinan halaman get-started platform asli |
| `/dashboard/billing`, `/dashboard/billing/history` | Penagihan dan Riwayat Penagihan klien |
| `/dashboard/ticket` | Kanban tiket admin |

`/` memakai root layout sendiri (`app/(site)`), terpisah dari aplikasi (`app/(app)`).
Akibatnya, pindah dari landing ke `/login` selalu memuat ulang halaman penuh.

## Akun

| Akun | Email / kata sandi | Keterangan |
|---|---|---|
| Mbee Cafe (klien terdaftar) | `halo@mbeecafe.id` / `mbee1234` | Sudah punya akun; diskusi dan bayar lewat widget di dashboard |
| Akun dari Voice AI | email yang disebut di percakapan / kata sandi sementara (mis. `Mbee-7K4Q-29`) | Dibuat setelah pembayaran di landing; wajib ganti kata sandi |
| Mbee Platform Internal (admin) | `admin@mbeeplatform.id` / `admin1234` | Kanban tiket |

Penyimpanan:
- Tiket, tagihan, dan akun disimpan di **Supabase** (schema `mbee`: `tickets`, `invoices`, `accounts`, `meta`) lewat route `app/api/*`.
  Tabel dibuat dan diisi data contoh otomatis saat request pertama; kata sandi disimpan sebagai hash (scrypt).
- Dashboard memuat ulang data tiap 2 detik (polling), jadi kanban admin di perangkat lain ikut berubah saat Voice AI mengisi tiket.
- Login disimpan per tab (sessionStorage); kata sandi dicek di server.
- Aturan kata sandi baru sama dengan platform asli: minimal 12 karakter, kombinasi karakter, bukan kata sandi umum, dan tanpa pola berulang/berurutan.

## Alur percakapan Voice AI

### A. Pengunjung landing (tanpa login)
1. **Keluhan dan keinginan:** chat WhatsApp menumpuk, ingin jawaban menu otomatis dan pesanan tercatat.
2. **Paket bundling** dipilih lewat popup (Starter direkomendasikan). Kendala WhatsApp Business API dicatat.
3. **Data akun:** nama, nama usaha, email, dan nomor WhatsApp.
   - Nama, email, dan nomor dikonfirmasi lewat popup (opsi tulisan agen + "Lainnya" untuk koreksi).
   - Demo sengaja salah dengar: nama "Ardiansah" dan email tanpa titik.
4. **Pembayaran** lewat dialog. Bila gagal, Mbee menjelaskan penyebabnya dan menawarkan coba lagi. Enterprise dihubungi tim sales.
5. Setelah lunas, **sistem membuat akun**. Mbee menampilkan kartu akun:
   - email dan kata sandi sementara (bisa disalin),
   - catatan "juga dikirim ke email",
   - tombol **Masuk ke Dashboard**.
6. "Ada hal lain?" → selesai.
7. **Masuk ke Dashboard:** `/login` dengan email terisi → kata sandi sementara → `/new-password` → `/dashboard/get-started`.
   Riwayat Penagihan akun baru berisi invoice dari pembayaran di landing.

**Email sudah terdaftar:** setelah email dikonfirmasi, Mbee mengecek akun. Bila email sudah punya akun, Mbee memberi tahu akunnya sudah digunakan. Calon klien memilih email lain (ketik manual) atau masuk ke akun itu (tab baru), dan tidak ada tagihan baru.

### B. Klien terdaftar (sudah login, widget di dashboard)
- **Belum berlangganan:** kebutuhan → pilih paket → pembayaran → popup **Pindah ke Riwayat Penagihan?** → "Ada hal lain?" → selesai.
- **Paket sudah aktif:** popup topik.
  - **Upgrade paket:** hanya paket di atas paket aktif yang ditawarkan, paket di bawahnya tidak bisa dibeli lagi. Cukup **bayar selisih harga**, dan masa berlaku tetap sampai akhir periode berjalan. Enterprise lewat tim sales.
  - **Status verifikasi WhatsApp Business:** dicatat ke tiket untuk tim teknis.

### Riwayat Penagihan, tab Langganan
Ringkasan paket aktif + semua kartu paket: paket aktif ditandai, paket di bawahnya tidak tersedia, paket di atasnya tombol **Upgrade** dengan keterangan selisih harga.

## Alur demo yang disarankan

1. Buka dua tab berdampingan. Tab kiri buka `/` (landing), tab kanan login admin.
2. Tab kiri: klik avatar Mbee di kanan bawah → **Mulai bicara**, izinkan mikrofon, lalu ceritakan kendala kafe secara lisan.
   (Mode simulasi: kecepatan 2× bila waktu sempit.)
3. Tab kanan: tiket "Calon klien · Sesi Voice AI landing" muncul di kolom Open dengan label LIVE dan terisi selama percakapan.
4. Tab kiri: koreksi nama/email, pilih paket, coba bayar gagal lalu berhasil. Kartu akun muncul; salin kata sandi sementara.
5. Tab kiri: **Masuk ke Dashboard** → masuk dengan kata sandi sementara → buat kata sandi baru → dashboard klien.
6. Tab kanan: buka tiket. Log aktivitas mencatat koreksi data, pembayaran, dan "Akun dibuat".
7. Jalur klien terdaftar: login Mbee Cafe → widget di dashboard → bayar → Riwayat Penagihan.
8. Ulangi demo: di akun admin, menu **⋯ → Pulihkan data contoh** mengembalikan tiket, riwayat tagihan, dan akun dari Voice AI ke awal.

## Peta kode

| Bagian | Lokasi |
|---|---|
| Nama platform, asisten, domain | `lib/constants/brand.ts`, logo `components/shared/brand.tsx` |
| Landing mbee.io | `app/(site)/`, `components/landing/` |
| Akun, hak akses, aturan kata sandi | `lib/auth/accounts.ts`, `lib/auth/password-policy.ts`, `lib/stores/account-store.ts`, `components/auth/` |
| Model tiket (template Onboarding & Pembayaran) | `lib/types.ts`, `lib/constants/ticket.ts` |
| Satu pintu data tiket (ganti ke API di tahap 2) | `lib/data/ticket-repository.ts` |
| Paket, tagihan, checkout | `lib/constants/plans.ts`, `lib/stores/billing-store.ts`, `lib/stores/payment-store.ts` |
| Pintu sesi Voice AI (pilih mesin Live/simulasi), jembatan popup & navigasi | `lib/voice/session.ts`, `lib/voice/bridge.ts`, `lib/voice/session-setup.ts` |
| Voice AI Live: prompt, tools, audio, runner | `lib/voice/live/` (`prompt.ts`, `tools.ts`, `audio.ts`, `live-runner.ts`, `knowledge/`) |
| Route token Gemini dan email kredensial | `app/api/voice/session/route.ts`, `app/api/voice/email/route.ts` |
| Naskah (tamu & anggota) dan pemutar simulasi Voice AI | `lib/voice/demo-script.ts`, `lib/voice/demo-runner.ts` |
| Widget Voice AI, popup pertanyaan, kartu akun, avatar Rive | `components/voice/` (`public/rive/avatar.riv`) |
| Dialog pembayaran, Penagihan, Riwayat Penagihan | `components/billing/` |
| Halaman Mulai klien (salinan platform asli) | `components/get-started/` |
| Kanban tiket admin | `components/tickets/` |

## Catatan avatar

`avatar.riv` hanya punya state machine `State Machine 1` dengan satu input boolean `Hover/Select`
(pose diam ↔ pose aktif) dan layer kedip. Ekspresi mendengarkan, berpikir, berbicara, senang, dan bingung
dibuat dari efek di sekitar avatar (`components/voice/avatar-stage.tsx`). Menu tabung (Pengaturan demo)
di widget dipakai untuk memilih mode percakapan dan mencoba tiap ekspresi.

## Tahap 2: cara kerja Voice AI Live

- Tool call agen dijalankan di browser (tempat tiket, tagihan, dan akun berada): `catat_kebutuhan`, `atur_jenis_tiket`,
  `tampilkan_pilihan_paket`, `konfirmasi_paket_pilihan`, `konfirmasi_data` (nama, nama usaha, email, telepon), `tangani_email_terdaftar`, `buka_pembayaran`,
  `buat_tiket_kendala` (klien login melapor kendala, urgensi ditentukan Gemini), `tanya_pilihan`, `jawab_popup` (pelanggan menjawab popup secara lisan), `buat_akun`, `buka_halaman`, `simpan_ringkasan`, `akhiri_sesi`.
- Tool yang membuka popup/jendela pembayaran langsung menjawab `menunggu_pelanggan`, supaya Mbee bisa berkata
  "mohon cek di layar" selagi popup terbuka; jawaban pelanggan dikirim ke Gemini sebagai pesan `[HASIL nama_tool]`.
- Kata sandi sementara tidak pernah dikirim ke model, jadi tidak bisa diucapkan.
- Belum: `ticketRepository`, store tagihan, dan `account-store` masih di browser (localStorage); payment gateway masih simulasi.
