# Konteks Proyek: Mbee Platform × Mbee Cafe (Voice AI Customer Journey)

Dokumen ini merangkum percakapan perencanaan dan pengerjaan proyek supaya tim (atau sesi AI berikutnya)
bisa melanjutkan tanpa mengulang diskusi. Terakhir diperbarui: **26 Nov 2026**, tahap 1 iterasi 5 (klien tanpa login dulu).

---

## 1. Latar belakang

- Dibuat untuk **lomba build AI di rapat kerja tahunan**, waktu maksimal **24 jam**. Tema tim: **Customer Journey**.
- Relevan dengan platform asli tim (repo `mimin-workflow`, Next.js), yang journey B2C-nya masih kurang baik
  dan belum memakai Voice AI sebagai agen pembantu sampai pembayaran dan ringkasan.
- Karena platform asli terlalu besar, proyek ini adalah **aplikasi terpisah** (`mbee-cafe/`) yang meniru tampilan
  platform (sidebar, topbar, halaman tertentu) dengan **data mock**.
- **Tahap 1 (selesai):** UI + data mock + percakapan Voice AI berupa **naskah simulasi** (belum ada AI).
- **Tahap 2 (menunggu instruksi user):** menyalakan AI suara asli.

## 2. Skenario

- **Mbee Cafe** adalah klien retail (*"mbee" = suara domba, bukan lebah*) yang mendaftar di **Mbee Platform**.
- Mbee Cafe mengaktifkan Voice AI untuk onboarding. Agen suara (**Mbee**) membuka percakapan, bertanya jawab,
  membantu **setup akun**, **memilih paket layanan bundling**, lalu **pembayaran**, dan menyimpan **ringkasan**.
- Data yang dikumpulkan selama onboarding masuk ke **tiket** (template *Onboarding & Pembayaran*):
  1. ID unik (format `TKT-YYYYMMDD-NNN`)
  2. Nama
  3. Email *(ditambahkan di iterasi 4)*
  4. Telepon
  5. Nama perusahaan
  6. Produk/layanan yang di-onboard. Sekarang berupa **paket bundling** (Seed/Starter/Growth/Enterprise), bukan produk satuan.
  7. Ringkasan isu, terstruktur: ringkasan, kebutuhan, kendala, tindak lanjut, sentimen
  8. Status isu: `open` / `on_progress` / `resolved`
  9. Metode bayar
  10. Status bayar
- **Iterasi 5: skenario fleksibel, klien tidak perlu login dulu.**
  - `/` adalah landing **mbee.io** (rebrand mimin.io, bahasa Indonesia) dengan widget Voice AI di kanan bawah.
  - Pengunjung berdiskusi soal keluhan dan keinginan, memilih paket, lalu membayar.
  - Setelah lunas, "backend" membuat akun dengan **kata sandi sementara** yang wajib diganti saat pertama masuk (`/new-password`).
  - Dashboard pindah ke `/dashboard/*`.
- Akun (tanpa register):
  - **Mbee Cafe terdaftar** (`halo@mbeecafe.id`): sudah punya akun, diskusi dan bayar lewat widget di dashboard (alur lama).
  - **Akun dari Voice AI**: dibuat setelah pembayaran di landing (email dari percakapan).
  - **Mbee Platform Internal** (admin): memantau tiket di kanban.

## 3. Aturan kerja dan preferensi user (wajib diikuti)

1. **Brainstorm dulu, coding setelah disepakati.** User ingin berdiskusi dan memberi persetujuan sebelum pekerjaan besar dimulai.
2. **Tiru pola UI asli `mimin-workflow`, jangan mengarang varian.**
   - User pernah menegur karena halaman Tiket dibuat versi tabel; versi aslinya **kanban**.
   - Sebelum membuat halaman yang ada padanannya, baca komponen aslinya di `c:\Users\Asus\Desktop\project\mimin-workflow`.
   - Tambahan di luar pola asli harus disebutkan ke user.
3. **Nama di UI = Mbee Platform**, asisten Voice AI = **Mbee**. Jangan tampilkan "mimin" di teks yang terlihat pengguna.
   Komentar kode yang merujuk repo `mimin-workflow` boleh tetap ada.
4. Hanya **bahasa Indonesia**, hanya **mode terang**, gaya **"Flat Minimal compact"** (aturan di `mimin-workflow/AGENTS.md`):
   - Kartu putih berborder tipis di atas latar abu.
   - Tombol `rounded-full`.
   - Tanpa blur atau gradient, kecuali hero onboarding.
5. Hanya tampilkan **menu/halaman yang dipakai skenario**:
   - Klien: Mulai + Penagihan.
   - Admin: Tiket.
6. Avatar memakai **opsi B**: `avatar.riv` dipakai apa adanya, ekspresi dibangun dari efek di sekitarnya.
7. **Halaman Mulai (`/dashboard/get-started`) = salinan persis get-started platform asli.**
   - Tidak dikaitkan dengan onboarding Voice AI.
   - Satu-satunya perubahan: nama "Mbee Platform", dan tombol langkah yang halamannya tidak ada memunculkan toast "belum tersedia di versi demo".
8. **Landing dibangun dengan skill `design-taste-frontend`** atas permintaan user.
   - Struktur dan fakta mengikuti mimin.io.
   - Teks berbahasa Indonesia.

## 4. Riwayat iterasi (ringkas)

| Iterasi | Permintaan user | Hasil |
|---|---|---|
| 0. Brainstorm | Paham konsep, beri saran | Disepakati: tampilan meniru platform, avatar opsi B, install ulang Next.js, tanpa halaman konfigurasi Voice AI, bahasa Indonesia saja |
| 1. Build awal | Install Next.js + shadcn, UI seperti platform, widget Voice AI + Rive | Next 16.4.6 + shadcn `radix-nova`; sempat ada dashboard, tabel tiket, widget dengan stepper |
| 2. Perbaikan | Hapus menu yang tidak dipakai; ikon sidebar compact tidak kotak; halaman klien di `/get-started`; tiket untuk akun internal (login 2 akun); widget tanpa stepper; tiket harus **kanban**, bersifat umum | Login 2 akun (sesi per tab); kanban drag & drop; widget hanya avatar + transkrip + kontrol; tiket umum berbasis template |
| 3. Perbaikan | Popup konfirmasi nama (gaya pertanyaan Claude Code); dialog pembayaran (tanpa tab baru, timeout 3 detik, Voice AI cek hasil, jelaskan bila gagal); halaman Penagihan + Riwayat; onboarding = setup akun; setelah lunas tawarkan pindah ke riwayat, lalu tanya "ada hal lain?" | Semua diterapkan; tagihan & invoice di store sendiri |
| 4. Perbaikan | Ganti nama platform jadi **Mbee Platform** + akunnya; minta **email** + popup konfirmasi; popup konfirmasi **nomor telepon**; pilihan layanan berupa **paket bundling** seperti halaman Penagihan | Rebrand (logo SVG baru, akun admin `admin@mbeeplatform.id`); field email; validasi email/telepon di popup; popup pilih paket |
| 6. Penyempurnaan iterasi 5 | Hover popup gelap di landing; konfirmasi 3 opsi (tulisan AI / Revisi terisi / Lainnya kosong) untuk nama, email, nomor; Masuk ke Dashboard di tab baru; FAQ dan footer terpotong; halaman Riwayat Penagihan menampilkan semua kartu paket (bawah terkunci, atas upgrade bayar selisih); upgrade juga lewat Voice AI; cek email yang sudah punya akun | Lihat bagian 5 dan gotcha di bagian 9. User menguji E2E sendiri, jangan menjalankan uji E2E kecuali diminta |
| 5. Skenario fleksibel | Klien tidak perlu login: landing mbee.io di `/` + widget; bayar → BE kirim akun + kata sandi default yang wajib diganti; dashboard di `/dashboard`; get-started kembali persis platform asli. Keputusan: landing bahasa Indonesia, widget tetap di dashboard, 2 akun klien (terdaftar + dari landing), CTA get-started → toast | Dua root layout `(site)`/`(app)`; `account-store` + `/new-password`; naskah tamu & anggota; kartu akun di widget (tanpa popup "masuk sekarang" karena popup menutupi kata sandi) |

## 5. Status fitur saat ini

### Landing publik `/` (mbee.io, tanpa login)
- Dibangun dengan skill `design-taste-frontend`. Kode di `app/(site)/` dan `components/landing/`; kit skill di `public/assets/`.
- Tombol CTA utama memanggil `openVoiceAssistant()`.
- `<GuestVoiceAssistant />` memasang widget mode `guest` dan dialog pembayaran.

### Akun klien (Mbee Cafe terdaftar / akun dari Voice AI)
- **`/dashboard/get-started` (Mulai):** salinan get-started platform asli: 4 langkah inti, modal discovery, lewati/tandai selesai (`components/get-started/`).
- **`/new-password`:** wajib untuk akun dengan kata sandi sementara. AuthGate memblokir `/dashboard/*` sampai kata sandi diganti. Aturan kata sandi disalin dari mimin (`lib/auth/password-policy.ts`).
- **`/dashboard/billing` (Penagihan):** meniru `billing-layout` platform asli:
  - Judul "Siap Berkembang? Pilih Paketmu" dan kartu paket.
  - Tabel "Perbandingan Fitur", kartu "Riwayat Penagihan", dan kartu "Masih punya pertanyaan?".
  - Akun yang sudah punya langganan aktif dialihkan ke riwayat, sama seperti platform asli.
  - Tombol paket membuka dialog pembayaran.
- **`/dashboard/billing/history` (Riwayat Penagihan):** tab Langganan juga menampilkan semua kartu paket. Paket aktif ditandai, paket di bawahnya tidak tersedia, paket di atasnya bisa di-upgrade dengan bayar selisih (`PlanCard availability`).
- (lanjutan Riwayat Penagihan)
  - Tab Langganan: ringkasan paket aktif.
  - Tab Riwayat: tabel invoice dengan status DIBAYAR / MENUNGGU / GAGAL / DIBATALKAN, plus alasan gagal.
- **Widget Voice AI** (pojok kanan bawah):
  - Avatar Rive, transkrip, mikrofon/akhiri, kecepatan 1×/2×, dan menu "Uji ekspresi".
  - **Popup pertanyaan** muncul di dalam widget.
- **Dialog pembayaran:**
  - Metode QRIS, Virtual Account, e-wallet, kartu kredit.
  - *Mode simulasi* Berhasil/Gagal.
  - Alur: memproses → hasil → tertutup otomatis 3 detik → hasil dikirim ke Voice AI.

### Akun admin: Mbee Platform Internal
- **`/dashboard/ticket`:** kanban (Open / On progress / Resolved), drag & drop, pencarian, filter template/prioritas, dan Tambah/Ubah/Hapus tiket.
  - Panel detail 750px: Informasi Dasar, Informasi Tambahan (field template), Log aktivitas.
  - Label **LIVE** tampil saat tiket sedang diisi Voice AI, termasuk dari tab lain.
  - Menu **⋯ → Pulihkan data contoh** mengembalikan tiket, riwayat tagihan, dan akun dari Voice AI ke awal.

### Alur percakapan simulasi (`lib/voice/demo-script.ts`)
Mode widget menentukan naskah: `guest` di landing, `member` di dashboard (`useVoiceStore.mode`, diatur `VoiceWidget mode=`).

**`landingConversation` (tamu):**
1. Sapaan → keluhan → keinginan (dicatat ke tiket).
2. Popup pilih paket (Starter direkomendasikan) → kendala WhatsApp Business API.
3. Data akun: nama → nama usaha → email → nomor WhatsApp. Nama/email/nomor dikonfirmasi lewat popup dengan **3 opsi**:
   - tulisan AI,
   - **Revisi** (kolom terisi tulisan AI, tinggal diedit; dikirim tanpa diubah = sama dengan opsi 1),
   - **Lainnya** (kolom kosong, ketik dari nol).

   Transkripsi sengaja salah: "Dimas Ardiansah", email tanpa titik.
4. Pembayaran lewat dialog. Bila gagal: penjelasan + popup coba lagi. Enterprise → tim sales; akun belum dibuat.
5. Lunas → `provisionAccount` membuat akun (ID akun calon klien yang dipakai tiket & invoice sejak awal) → kartu akun:
   - email + kata sandi sementara + tombol *Masuk ke Dashboard* (`/login?email=`, **dibuka di tab baru** supaya kartu dan kata sandi tetap terlihat),
   - catatan "juga dikirim ke email".
6. Ringkasan disimpan → "Ada hal lain?" → selesai.

**Email sudah terdaftar (landing):** `ctx.emailTaken()` dicek setelah email dikonfirmasi, sebelum pembayaran. Bila sudah ada akun: Mbee memberi tahu akunnya sudah digunakan, lalu popup "Pakai email lain" (ketik manual, dicek lagi) atau "Masuk ke akun ini" (kartu dengan tombol, tab baru) dan percakapan berakhir. Tidak ada tagihan baru.

**`memberConversation` (sudah login):**
- **Belum berlangganan:** sapaan dengan nama akun → kebutuhan → paket → pembayaran → popup "Pindah ke Riwayat Penagihan?" → ringkasan → penutup.
- **Paket sudah aktif:** sapaan menyebut paket aktif → popup topik:
  - **Upgrade** (`upgradeConversation`, tiket template `billing`): hanya paket di atas paket aktif; harga = **selisih** (`upgradePrice` di `lib/constants/plans.ts`), masa berlaku tetap sampai akhir periode; Enterprise → tim sales.
  - **Status verifikasi WhatsApp Business** dicatat ke tiket template `technical`.

## 6. Model data

- **Ticket** (`lib/types.ts`):
  - Identitas & penanganan: `id`, `title`, `template` (`onboarding_payment` | `technical` | `billing` | `general`), `priority`, `assignee`, `accountId`.
  - Data pelanggan: `name`, `email`, `phone`, `companyName`.
  - Layanan: `products` (produk terkait, hanya untuk tiket umum) dan `planId` (paket bundling, untuk onboarding).
  - Isu & pembayaran: `summary{overview,needs,obstacles,nextAction,sentiment}`, `issueStatus`, `paymentMethod`, `paymentStatus` (null untuk tiket tanpa pembayaran), `amount`.
  - Metadata: `source` (`voice_ai` | `manual`), `createdAt`, `updatedAt`, `dueDate`, `journey[]` (log aktivitas).
- **Invoice** (`lib/stores/billing-store.ts`):
  - Identitas: `id` (`INV/YYYYMMDD/NNNN`), `accountId`, `planId`, `amount`.
  - Status & metode: `status` (`pending` | `paid` | `failed` | `cancelled`), `method`, `channel`, `failureReason`.
  - Waktu: `createdAt`, `paidAt`, `periodStart`, `periodEnd`.
  - Satu percobaan bayar = satu baris.
- **Paket** (`lib/constants/plans.ts`):
  - Seed Rp499.000, Starter Rp1.299.000, Growth Rp2.499.000 (Paling Populer), Enterprise Custom.
  - **Harga ini contoh**, karena di platform asli harga datang dari backend.
  - Fitur meniru platform asli (Kursi, MUV, Saluran, MAU, Alur, MAS).
- **Invoice upgrade:** `Invoice.upgradeFrom` (paket sebelumnya) dan `amount` = selisih harga. "Tarif bulanan" di tab Langganan memakai harga paket, bukan `amount`. Pada pembayaran lunas, `periodEnd` upgrade = periode yang sudah dibayar sebelumnya (`payment-store.finishCheckout`).
- **Popup pertanyaan** (`VoiceQuestion` di `lib/stores/voice-store.ts`): `options` + `revise?` (isian terisi nilai opsi pertama) + `other?` (isian kosong). `options: []` dengan hanya `other` dipakai untuk meminta email baru.
- **Akun dari Voice AI** (`lib/stores/account-store.ts`):
  - Field: `DemoAccount` + `source: "voice_ai"`, `mustChangePassword`, `password` (kata sandi sementara format `Mbee-XXXX-NN`).
  - Email yang sudah terdaftar tidak bisa dipakai lagi (dicek Voice AI sebelum pembayaran).
  - `authenticate`/`findAccountById` mencari di akun bawaan + akun ini.
- **Penyimpanan di browser:**
  - Tiket `mbee-platform-tickets-v3`, tagihan `mbee-platform-billing-v1`, dan akun `mbee-platform-accounts-v1` di localStorage, disinkronkan antar tab lewat event `storage`.
  - Sesi `mbee-platform-session` di **sessionStorage (per tab)**, supaya dua akun bisa dibuka berdampingan di satu browser.

## 7. Peta kode

| Bagian | Lokasi |
|---|---|
| Nama platform/asisten, logo | `lib/constants/brand.ts`, `components/shared/brand.tsx` |
| Rute | `app/(site)/` (landing, root layout sendiri), `app/(app)/` (login, new-password, `dashboard/*`) |
| Landing mbee.io | `components/landing/`, kit skill di `public/assets/` |
| Akun, login, penjaga akses, ganti kata sandi | `lib/auth/accounts.ts`, `lib/auth/password-policy.ts`, `lib/stores/account-store.ts`, `components/auth/` (`auth-gate.tsx`, `login-screen.tsx`, `new-password-screen.tsx`) |
| Kerangka sidebar/topbar | `components/layout/` |
| Tiket: repository, store, data contoh | `lib/data/ticket-repository.ts`, `lib/stores/ticket-store.ts`, `lib/data/seed-tickets.ts` |
| Kanban & detail tiket | `components/tickets/` |
| Paket, tagihan, checkout | `lib/constants/plans.ts`, `lib/stores/billing-store.ts`, `lib/stores/payment-store.ts`, `components/billing/` |
| Voice AI: store, naskah, pemutar | `lib/stores/voice-store.ts`, `lib/voice/demo-script.ts`, `lib/voice/demo-runner.ts` |
| Widget, popup pertanyaan, kartu akun, avatar | `components/voice/` (`voice-widget.tsx`, `guest-voice-assistant.tsx`, `question-prompt.tsx`, `message-attachments.tsx`, `avatar-stage.tsx`, `rive-avatar.tsx`) |
| Halaman Mulai (salinan platform asli) | `components/get-started/` |

## 8. Menjalankan dan demo

- `pnpm dev` (port 3000). User biasanya sudah menjalankan dev server sendiri, jadi **jangan dimatikan**.
- `pnpm build` tidak butuh internet karena font Poppins disimpan lokal di `app/fonts/`.
- Alur demo dua tab ada di `README.md` utama.

## 9. Catatan teknis (gotcha yang sudah ditemui)

- **Next.js 16.4.6.** Baca `node_modules/next/dist/docs/` sebelum menulis kode (lihat `AGENTS.md`). `params`/`searchParams` berupa Promise; `useSearchParams` butuh `<Suspense>`.
- **lucide-react v1 mengganti nama ikon,** misalnya `Trash2` → `Trash`, `TriangleAlert` → `TriangleExclamationPoint`, `CircleHelp` → `CircleQuestionMark`. Tidak ada ikon `History`; pakai `ReceiptText`.
- **Class `bg-linear-to-br` (saran IDE Tailwind v4) tidak termuat di dev server.** Hero jadi pudar, jadi tetap pakai `bg-gradient-to-br`. Abaikan saran kosmetik serupa kecuali sudah diuji.
- **Class bawaan shadcn Sheet memakai `data-[side=...]`.** Untuk mengubah lebar sheet, pakai prefix yang sama (`data-[side=right]:sm:max-w-[750px]`).
- **`@hello-pangea/dnd` hanya mendukung satu kontainer scroll per Droppable.** Daftar kartu yang di-scroll dijadikan Droppable, dan papan tidak menjadi kontainer scroll di layar `xl`.
- **Avatar Rive:**
  - `avatar.riv` hanya punya state machine `State Machine 1` dengan input boolean `Hover/Select` dan layer kedip.
  - Artboard berlatar navy persegi, jadi dipotong bulat dengan `scale(1.76)`.
  - Rule lint React Compiler melarang mengubah `.value` dari hasil hook, jadi input diambil lewat `rive.stateMachineInputs()` di effect.
- **Komponen shadcn bawaan Nova sudah disesuaikan ke gaya platform:**
  - Tombol `rounded-full`.
  - Kartu berborder, bukan ring.
  - Tooltip putih berborder.
  - Overlay `bg-black/50` tanpa blur.
- **Dev overlay Next menghitung `console.error` sebagai "Issue".** Jangan memakai `console.error` untuk log debug.
- **Dua root layout (`app/(site)/layout.tsx` dan `app/(app)/layout.tsx`), tanpa `app/layout.tsx`.**
  - Pindah antar keduanya = muat ulang penuh. Sesi Voice AI di landing berakhir saat pindah ke `/login`, jadi tombol masuk ada di kartu akun, bukan di tengah percakapan.
  - Font Poppins dipakai bersama lewat `app/fonts/poppins.ts`.
- **`.next/types` sisa `pnpm build` lama bisa bentrok dengan `.next/dev/types`** setelah struktur rute berubah. Hapus `.next/types` bila `pnpm typecheck` mengeluh soal rute.
- **Di Windows, folder rute yang sedang dipantau dev server kadang tidak bisa di-`mv`** (Permission denied). Salin lalu hapus folder lama.
- **Uji E2E:** Playwright + Chromium tersedia di `mimin-workflow/node_modules`. Skrip bisa `require` dari path absolutnya. User menguji alur E2E sendiri; cukup verifikasi UI.
- **Kit landing menimpa token warna shadcn.**
  - Kit mendefinisikan ulang `--muted`, `--accent`, `--card`, `--border`, dst. di `:root` dengan arti lain (mis. `--muted` = abu gelap untuk teks), sehingga `hover:bg-muted` di widget Voice AI jadi gelap, hanya di landing.
  - `components/voice/voice-scope.css` (diimpor `guest-voice-assistant.tsx`) mengembalikan nilai asli khusus untuk widget dan komponen Radix yang ter-portal (dialog, menu, tooltip, toast).
  - `app/(site)/landing.css` juga memakai `all: revert-layer` di dalam widget supaya aturan elemen kit tidak menimpa kelas Tailwind.
- **Input `type="email"`/`"tel"` tidak mendukung `setSelectionRange`** (melempar `InvalidStateError`). Kolom Revisi/Lainnya di popup memakai `type="text"` + `inputMode`, validasi format dilakukan sendiri.
- **Dev server tidak selalu mengompilasi kelas Tailwind baru** untuk halaman yang sedang dimuat (mis. `hover:bg-slate-100` tidak muncul di CSS). Pakai kelas yang sudah ada di proyek, atau restart dev server.
- **Error "module factory is not available" setelah banyak hot-reload** (mis. dari landing ke `/login`) hanya cache dev di browser: hard reload (`Ctrl+Shift+R`). Halaman yang dimuat dari awal tidak error.
- **Section landing jangan dikunci tinggi satu layar dengan isi yang bisa lebih panjang.** Kit mengunci section sebesar layar dan baris atas grid footer boleh menyusut (`minmax(0, 1fr)`), sehingga isi meluber di layar pendek (FAQ terpotong, kata besar footer menimpa tautan). `landing.css` membuat section dan footer `min-height` (bukan `height`) mulai 1280px.
- **Gate skill design-taste-frontend** (`.taste-skill/`, tidak di-commit) menilai PASS walau ada kerusakan visual. Selalu cek screenshot di 1920×910, 1366×768, dan 390 selain gate.

## 10. Rencana tahap 2 (belum dikerjakan, tunggu instruksi user)

- Ganti `say`/`hear` di naskah dengan sesi suara asli. Platform asli memakai `@elevenlabs/react` (`useConversation`, token dari backend).
- Jadikan fungsi konteks naskah sebagai **tool call** agen (termasuk `provisionAccount` → API pembuatan akun + email kredensial):
  - `ask` → popup konfirmasi (nama/email/telepon/paket/navigasi)
  - `updateTicket` → CRUD tiket
  - `pay` → buka checkout dan tunggu hasil
  - `navigate` → pindah halaman
- Ganti isi `ticketRepository` dan store tagihan dengan API/backend dan payment gateway.
- TTS perlu ejaan fonetik supaya "Mbee" terdengar "mbeee", bukan "em-bi".

## 11. Hal yang masih bisa diputuskan user

- Jawaban "ada hal lain?" di akhir masih berupa ucapan naskah. Bisa dijadikan popup bercabang ("Ya, ada lagi" / "Tidak").
- Harga paket hanya contoh; sesuaikan bila ada harga resmi.
- Nama asisten "Mbee" dipilih mengikuti rebrand. Ganti di `lib/constants/brand.ts` bila ingin nama lain.
- Pilihan topik "Status verifikasi WhatsApp Business" untuk akun yang sudah berlangganan adalah usulan, bukan permintaan user; upgrade paket adalah permintaan user.
- Harga upgrade = selisih harga paket (tanpa prorata harian), masa berlaku tetap; tiket upgrade memakai template `billing`. Ubah bila ada aturan harga resmi.
- Hero landing di layar tablet 1024px: kartu tiket menutupi sebagian balon chat (belum dirapikan).
- Akun dari Voice AI di landing tetap bernama usaha "Mbee Cafe" (sama dengan akun terdaftar, beda email).
