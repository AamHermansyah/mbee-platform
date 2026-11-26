import { PLANS } from "@/lib/constants/plans"

/**
 * Deklarasi function calling untuk Gemini Live (format JSON BidiGenerateContentSetup).
 * Dipakai route /api/voice/session (dikirim ke Gemini) dan live-runner (nama tool → eksekutor di browser,
 * karena tiket, tagihan, akun, dan popup semuanya ada di browser).
 *
 * Pola dari proyek "WebRTC Avatar Revised" (simpan_data_onboarding / selesaikan_onboarding),
 * dipecah sesuai fitur Mbee Platform: popup koreksi data, pilih paket, pembayaran, akun, navigasi.
 */

export const TOOL = {
  noteNeeds: "catat_kebutuhan",
  setTicketKind: "atur_jenis_tiket",
  showPlans: "tampilkan_pilihan_paket",
  choosePlan: "konfirmasi_paket_pilihan",
  confirmData: "konfirmasi_data",
  emailTaken: "tangani_email_terdaftar",
  openPayment: "buka_pembayaran",
  askChoice: "tanya_pilihan",
  createAccount: "buat_akun",
  openPage: "buka_halaman",
  saveSummary: "simpan_ringkasan",
  endSession: "akhiri_sesi",
} as const

export type ToolName = (typeof TOOL)[keyof typeof TOOL]

const PLAN_IDS = PLANS.map((p) => p.id)

type Schema =
  | { type: "STRING"; description?: string; enum?: string[] }
  | { type: "OBJECT"; description?: string; properties: Record<string, Schema>; required?: string[] }
  | { type: "ARRAY"; description?: string; items: Schema }

interface FunctionDeclaration {
  name: ToolName
  description: string
  parameters?: Extract<Schema, { type: "OBJECT" }>
}

const str = (description: string, values?: readonly string[]): Schema =>
  values ? { type: "STRING", description, enum: [...values] } : { type: "STRING", description }

export const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: TOOL.noteNeeds,
    description:
      "Catat keluhan, keinginan, atau kendala pelanggan ke tiket segera setelah kamu memahaminya. Isi hanya field yang baru; boleh dipanggil berkali-kali.",
    parameters: {
      type: "OBJECT",
      properties: {
        kebutuhan: str("Keluhan/kebutuhan utama pelanggan, 1 kalimat, disusun olehmu."),
        keinginan: str("Hasil yang ingin dicapai pelanggan, 1 kalimat."),
        kendala: str("Kendala atau kekhawatiran pelanggan (mis. belum punya WhatsApp Business API)."),
      },
    },
  },
  {
    name: TOOL.setTicketKind,
    description:
      "Khusus klien yang sudah login: tentukan jenis tiket sesi ini setelah topik jelas. upgrade = naik paket, teknis = pertanyaan/kendala teknis, umum = lainnya, onboarding = beli paket pertama.",
    parameters: {
      type: "OBJECT",
      properties: {
        jenis: str("Jenis tiket.", ["onboarding", "upgrade", "teknis", "umum"]),
        judul: str("Judul tiket singkat, mis. 'Status verifikasi WhatsApp Business API'."),
      },
      required: ["jenis", "judul"],
    },
  },
  {
    name: TOOL.showPlans,
    description:
      "Tampilkan popup pilihan paket di layar dan TUNGGU pilihan pelanggan. Untuk klien yang paketnya sudah aktif, sistem otomatis hanya menampilkan paket di atasnya dengan harga selisih (upgrade). Hasilnya paket yang dipilih beserta harga.",
    parameters: {
      type: "OBJECT",
      properties: {
        rekomendasi: str("Paket yang kamu rekomendasikan berdasarkan kebutuhan.", PLAN_IDS),
      },
      required: ["rekomendasi"],
    },
  },
  {
    name: TOOL.choosePlan,
    description:
      "Pelanggan SUDAH menyebut paket yang diinginkan (mis. 'saya mau paket Starter'). Panggil SETELAH kamu menjelaskan benefit dan fitur utama paket itu. Menampilkan popup konfirmasi khusus paket itu ('Ya, pilih ...' atau 'Lihat paket lain') dan TUNGGU jawaban pelanggan; bukan popup semua paket. Jangan dipakai bila pelanggan belum menyebut nama paket; untuk itu pakai tampilkan_pilihan_paket. Untuk klien berpaket aktif, hanya paket di atas paket aktif yang bisa dipilih.",
    parameters: {
      type: "OBJECT",
      properties: {
        paket: str("Paket yang disebut pelanggan.", PLAN_IDS),
      },
      required: ["paket"],
    },
  },
  {
    name: TOOL.confirmData,
    description:
      "Tampilkan popup konfirmasi untuk data yang rawan salah dengar (nama, nama usaha, email, nomor telepon) berisi tulisanmu, opsi Revisi, dan opsi ketik ulang, lalu TUNGGU jawaban pelanggan. Hasilnya nilai final yang benar; pakai nilai itu, bukan yang kamu dengar. Untuk email, hasilnya juga memberi tahu apakah email sudah terdaftar.",
    parameters: {
      type: "OBJECT",
      properties: {
        jenis: str("Jenis data.", ["nama", "nama_usaha", "email", "telepon"]),
        nilai: str(
          "Data persis seperti yang kamu tangkap. Email: huruf kecil tanpa spasi, 'at' jadi @, 'titik/dot' jadi titik. Telepon: angka saja."
        ),
      },
      required: ["jenis", "nilai"],
    },
  },
  {
    name: TOOL.emailTaken,
    description:
      "Panggil setelah konfirmasi_data email menyatakan email sudah terdaftar dan kamu sudah menjelaskannya. Menampilkan popup 'Pakai email lain' atau 'Masuk ke akun ini' dan TUNGGU pilihan pelanggan.",
  },
  {
    name: TOOL.openPayment,
    description:
      "Buka jendela pembayaran untuk paket yang sudah dipilih dan TUNGGU hasilnya (lunas, gagal, atau dibatalkan). Panggil hanya setelah pelanggan setuju membayar. Paket Enterprise tidak lewat pembayaran (tim sales).",
  },
  {
    name: TOOL.askChoice,
    description:
      "Tampilkan popup pilihan (2-4 opsi) dan TUNGGU jawaban pelanggan. Pakai untuk: coba bayar lagi atau nanti, pindah ke Riwayat Penagihan atau tetap di sini, dan memilih topik bantuan.",
    parameters: {
      type: "OBJECT",
      properties: {
        judul: str("Label pendek popup, 1-2 kata, mis. 'Pembayaran'."),
        pertanyaan: str("Pertanyaan singkat."),
        opsi: {
          type: "ARRAY",
          description: "2 sampai 4 opsi.",
          items: {
            type: "OBJECT",
            properties: {
              nilai: str("Kode opsi, mis. 'retry'."),
              label: str("Teks opsi."),
              keterangan: str("Keterangan singkat opsi."),
            },
            required: ["nilai", "label"],
          },
        },
      },
      required: ["judul", "pertanyaan", "opsi"],
    },
  },
  {
    name: TOOL.createAccount,
    description:
      "Khusus tamu landing, setelah pembayaran LUNAS: minta sistem membuat akun Mbee Platform dengan kata sandi sementara dan mengirim detailnya ke email pelanggan. Kartu akun tampil di layar. Kamu tidak akan menerima kata sandinya.",
  },
  {
    name: TOOL.openPage,
    description: "Khusus klien yang sudah login: pindahkan halaman dashboard pelanggan.",
    parameters: {
      type: "OBJECT",
      properties: { halaman: str("Halaman tujuan.", ["riwayat_penagihan", "penagihan", "mulai"]) },
      required: ["halaman"],
    },
  },
  {
    name: TOOL.saveSummary,
    description:
      "Simpan ringkasan akhir sesi ke tiket sebelum menanyakan 'ada hal lain'. Untuk tim yang menindaklanjuti.",
    parameters: {
      type: "OBJECT",
      properties: {
        ringkasan: str("Ringkasan seluruh percakapan, 2-4 kalimat: topik, keputusan, status pembayaran."),
        kebutuhan: str("Kebutuhan pelanggan."),
        kendala: str("Kendala/kekhawatiran; kosongkan bila tidak ada."),
        tindak_lanjut: str("Tindak lanjut untuk tim."),
        sentimen: str("Sentimen pelanggan.", ["positive", "neutral", "negative"]),
      },
      required: ["ringkasan", "tindak_lanjut", "sentimen"],
    },
  },
  {
    name: TOOL.endSession,
    description:
      "Akhiri panggilan. Panggil hanya setelah kamu mengucapkan salam penutup dan pelanggan tidak butuh bantuan lain.",
  },
]
