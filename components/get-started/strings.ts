import { PLATFORM_NAME } from "@/lib/constants/brand"

/**
 * Teks halaman Mulai, disalin apa adanya dari mimin-workflow `i18n/id.json` (kunci yang
 * dipakai get-started-client dan discovery-modal). Satu-satunya perubahan: nama platform
 * "Mimin" diganti PLATFORM_NAME. Proyek ini tidak memakai next-intl, jadi `t` di bawah
 * menggantikan `useTranslations()`.
 */
const ID: Record<string, string> = {
  skip_this_step: "Lewati Langkah Ini",
  step_completed: "Selesai",
  back: "Kembali",
  cancel: "Batalkan",
  welcome_to_mimin: `Selamat datang di ${PLATFORM_NAME}`,
  get_started_hero_title: "Aktifkan AI agen pertama Anda dalam {count} langkah",
  get_started_hero_desc: `Halaman ini memandu Anda melalui hal-hal penting. Setiap langkah membuka halaman ${PLATFORM_NAME} yang ada — progres Anda tersimpan otomatis.`,
  get_started_total_duration: "~ 18 menit total",
  skipped: "Dilewati",
  mark_as_completed: "Tandai selesai",
  step_label: "Langkah",
  gs_agent_title: "Buat AI Agent Pertama Anda",
  gs_agent_desc:
    "Konfigurasikan persona, basis pengetahuan, dan tujuan AI Anda — siap menangani percakapan pelanggan nyata sejak hari pertama.",
  gs_agent_b1: "Atur judul & deskripsi chatbot",
  gs_agent_b2: "Selesaikan wizard 6 langkah",
  gs_agent_b3: "Simpan & aktifkan",
  gs_agent_cta: "Buka GenAI Chatbot",
  gs_agent_duration: "~ 10 menit",
  gs_inbox_title: "Hubungkan Saluran",
  gs_inbox_desc:
    "Hubungkan WhatsApp, Instagram, Website, atau email agar pelanggan dapat menjangkau agen Anda di saluran yang sudah mereka gunakan.",
  gs_inbox_b1: "Pilih saluran",
  gs_inbox_b2: "Konfigurasi kredensial",
  gs_inbox_b3: "Hubungkan ke agen",
  gs_inbox_cta: "Tambah Kotak Pesan",
  gs_inbox_duration: "~ 6 menit",
  gs_team_title: "Tambah Anggota Tim",
  gs_team_desc:
    "Tambahkan anggota tim agar mereka dapat mengambil alih percakapan dari AI dengan mulus saat sentuhan manusia diperlukan.",
  gs_team_b1: "Tambah akun pengguna",
  gs_team_b2: "Atur peran & izin",
  gs_team_b3: "Tetapkan ke kotak pesan",
  gs_team_cta: "Buka Pengguna",
  gs_team_duration: "~ 3 menit",
  gs_discovery_title: "Beritahu Kami Apa yang Perlu Ditangani",
  gs_discovery_desc:
    "Bagikan apa yang biasanya diminta pelanggan Anda — kami akan merekomendasikan modul yang tepat untuk membuat agen Anda benar-benar berguna.",
  gs_discovery_b1: "Penemuan 4 pertanyaan cepat",
  gs_discovery_b2: "Dapatkan rekomendasi modul yang dipersonalisasi",
  gs_discovery_b3: "Siapkan hanya yang Anda butuhkan",
  gs_discovery_cta: "Mulai Penemuan",
  gs_discovery_duration: "~ 2 menit",
  gs_oms_cat_title: "Siapkan Kategori Produk",
  gs_oms_cat_desc:
    "Atur katalog Anda agar agen AI dapat menelusuri produk dengan mudah selama percakapan.",
  gs_oms_cat_b1: "Tambah kategori",
  gs_oms_cat_b2: "Atur hierarki",
  gs_oms_cat_b3: "Tetapkan ke produk",
  gs_oms_cat_cta: "Buka Produk › Kategori",
  gs_oms_cat_duration: "~ 4 menit",
  gs_oms_prod_title: "Tambah Produk Anda",
  gs_oms_prod_desc: "Bangun katalog Anda dengan varian, harga, dan level stok.",
  gs_oms_prod_b1: "Tambah produk",
  gs_oms_prod_b2: "Atur harga & stok",
  gs_oms_prod_b3: "Tetapkan kategori",
  gs_oms_prod_cta: "Buka Produk",
  gs_oms_prod_duration: "~ 12 menit",
  gs_rms_cfg_title: "Konfigurasi Reservasi",
  gs_rms_cfg_desc:
    "Siapkan kategori layanan, layanan, dan jam operasional untuk pemesanan.",
  gs_rms_cfg_b1: "Kategori",
  gs_rms_cfg_b2: "Layanan",
  gs_rms_cfg_b3: "Jam operasional",
  gs_rms_cfg_cta: "Buka Konfigurasi Reservasi",
  gs_rms_cfg_duration: "~ 6 menit",
  gs_rms_cal_title: "Hubungkan Kalender",
  gs_rms_cal_desc: "Lihat dan kelola semua pemesanan dari kalender reservasi.",
  gs_rms_cal_b1: "Lihat pemesanan",
  gs_rms_cal_b2: "Kelola slot",
  gs_rms_cal_b3: "Kirim pengingat",
  gs_rms_cal_cta: "Buka Kalender Reservasi",
  gs_rms_cal_duration: "~ 3 menit",
  gs_ticket_tpl_title: "Buat Templat Tiket",
  gs_ticket_tpl_desc:
    "Tentukan kategori, kolom kustom, dan aturan penugasan otomatis untuk tiket masuk.",
  gs_ticket_tpl_b1: "Kategori",
  gs_ticket_tpl_b2: "Kolom kustom",
  gs_ticket_tpl_b3: "Aturan penugasan otomatis",
  gs_ticket_tpl_cta: "Buka Templat Tiket",
  gs_ticket_tpl_duration: "~ 5 menit",
  gs_ticket_first_title: "Buat Tiket Pertama",
  gs_ticket_first_desc:
    "Kirim tiket pertama Anda menggunakan templat yang sudah dibuat untuk mulai mengelola tugas.",
  gs_ticket_first_b1: "Pilih templat",
  gs_ticket_first_b2: "Isi detail tiket",
  gs_ticket_first_b3: "Kirim tiket",
  gs_ticket_first_cta: "Buat Tiket",
  gs_ticket_first_duration: "~ 2 menit",
  gs_campaign_tpl_title: "Buat Templat Broadcast",
  gs_campaign_tpl_desc:
    "Siapkan templat WhatsApp yang disetujui untuk mengirim promosi ke banyak kontak sekaligus.",
  gs_campaign_tpl_b1: "Nama templat",
  gs_campaign_tpl_b2: "Konten pesan",
  gs_campaign_tpl_b3: "Ajukan untuk persetujuan",
  gs_campaign_tpl_cta: "Buka Kampanye",
  gs_campaign_tpl_duration: "~ 5 menit",
  mg_order_management: "Manajemen Pesanan",
  mg_reservation_booking: "Reservasi & Pemesanan",
  mg_ticketing: "Tiket",
  mg_campaign_broadcast: "Kampanye / Siaran",
  module_discovery: "Penemuan Modul",
  your_recommendations: "Rekomendasi Anda",
  dm_q1_title: "Apakah pelanggan biasanya membeli produk melalui chat?",
  dm_q1_subtitle: "Jika ya, Anda membutuhkan katalog produk dan alur checkout.",
  dm_q1_yes: "Ya, mereka membeli produk",
  dm_q1_no: "Tidak, hanya pertanyaan saja",
  dm_q2_title: "Apakah pelanggan memesan janji, meja, atau layanan?",
  dm_q2_subtitle: "Restoran, klinik, salon, hotel biasanya membutuhkan ini.",
  dm_q2_yes: "Ya, mereka membuat pemesanan",
  dm_q2_no: "Tidak perlu pemesanan",
  dm_q3_title:
    "Apakah Anda perlu melacak masalah yang butuh lebih dari satu chat untuk diselesaikan?",
  dm_q3_subtitle:
    "Permintaan kompleks, keluhan, atau tindak lanjut yang membutuhkan riwayat tiket.",
  dm_q3_yes: "Ya, saya butuh pelacakan tiket",
  dm_q3_no: "Tidak, hanya chat sederhana",
  dm_q4_title: "Apakah Anda mengirim promosi atau pengumuman ke pelanggan?",
  dm_q4_subtitle:
    "Pesan siaran, promosi, atau kampanye ke banyak orang sekaligus.",
  dm_q4_yes: "Ya, saya mengirim siaran",
  dm_q4_no: "Belum",
  dm_recommend_modules: "Kami merekomendasikan {count} modul untuk Anda",
  dm_all_set: "Anda sudah siap!",
  dm_recommend_desc:
    "Berdasarkan jawaban Anda, ini yang perlu disiapkan. Anda dapat membatalkan pilihan yang tidak dibutuhkan sekarang.",
  dm_no_modules_desc:
    "AI Layanan Pelanggan saja sudah mencakup kebutuhan Anda. Anda selalu bisa menambahkan modul nanti dari sidebar.",
  dm_finish_onboarding: "Selesaikan onboarding",
  dm_skip_all_finish: "Lewati semua & selesai",
  dm_add_modules: "Tambah {count} modul",
  dm_oms_target: "Commerce › Manajemen Pesanan",
  dm_rms_target: "Commerce › Reservasi",
  dm_ticket_target: "Komunikasi › Tiket",
  dm_campaign_target: "Komunikasi › Kampanye",
  dm_question_of: "Pertanyaan {current} dari {total}",
  dm_module_steps_target: "{steps} langkah · {target}",
}

/** Pengganti `useTranslations()`: ambil teks lalu isi `{nama}` dari `params`. */
export function t(
  key: string,
  params?: Record<string, string | number>
): string {
  const message = ID[key]
  if (message === undefined) return key
  if (!params) return message
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  )
}

/**
 * Tambahan versi demo (tidak ada di mimin): tombol langkah menuju halaman yang belum
 * dibuat di demo ini, jadi diberi notifikasi alih-alih membuka halaman 404.
 */
export const DEMO_PAGE_UNAVAILABLE = "Halaman ini belum tersedia di versi demo."
