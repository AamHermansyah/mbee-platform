import { ASSISTANT_NAME, PLATFORM_NAME, PLATFORM_TEAM } from "@/lib/constants/brand"
import { getPlan, higherPlans, lowerPlans, PLANS, upgradePrice, type Plan, type PlanId } from "@/lib/constants/plans"
import { PAYMENT_METHOD_LABEL } from "@/lib/constants/ticket"
import { formatDate, formatRupiah } from "@/lib/format"
import type { PaymentOutcome } from "@/lib/stores/payment-store"
import type { AvatarMood, MessageAttachment, QuestionAnswer, VoiceQuestion } from "@/lib/stores/voice-store"
import type { IssueSummary, JourneyEvent, JourneyStage, TicketInput } from "@/lib/types"

/**
 * Naskah simulasi Voice AI (tahap 1, tanpa AI). Ada dua alur:
 *
 * 1. landingConversation — pengunjung landing "/" tanpa login:
 *    keluhan & kebutuhan → pilih paket bundling → data akun (nama, usaha, email, WhatsApp; data rawan
 *    salah dengar dikonfirmasi lewat popup) → pembayaran → "backend" membuat akun + kata sandi sementara
 *    (kartu akun dengan tombol Masuk ke Dashboard) → penutup.
 * 2. memberConversation — klien yang sudah login di dashboard:
 *    - belum punya paket aktif: kebutuhan → pilih paket → pembayaran → tawarkan pindah ke Riwayat Penagihan → penutup.
 *    - paket sudah aktif: pilih topik. Upgrade (hanya paket di atas paket aktif yang ditawarkan, yang di
 *      bawahnya tidak bisa dibeli lagi) → pembayaran → riwayat; atau catat status verifikasi WhatsApp → penutup.
 *
 * Tahap 2: say/hear diganti percakapan suara asli; ask, updateTicket, pay, provisionAccount,
 * dan navigate menjadi tool call dari agen suara dengan perilaku yang sama.
 */
export interface ProvisionedAccount {
  email: string
  password: string
  loginHref: string
}

export interface ConversationContext {
  say: (text: string, options?: { mood?: Extract<AvatarMood, "speaking" | "happy">; attachment?: MessageAttachment }) => Promise<void>
  /** Ucapan pelanggan seperti yang ditangkap transkripsi (bisa salah dengar). */
  hear: (text: string) => Promise<void>
  ask: (question: Omit<VoiceQuestion, "id">) => Promise<QuestionAnswer>
  stage: (stage: JourneyStage) => void
  mood: (mood: AvatarMood, ms: number) => Promise<void>
  updateTicket: (patch: Partial<TicketInput>, event?: Omit<JourneyEvent, "at">) => Promise<void>
  /** Membuka dialog pembayaran dan menunggu hasilnya (sudah termasuk jeda 3 detik di dialog). */
  pay: (planId: PlanId, upgradeFrom?: PlanId) => Promise<PaymentOutcome>
  /** Cek ke backend: apakah email ini sudah punya akun (akun bawaan maupun yang dibuat Voice AI). */
  emailTaken: (email: string) => Promise<boolean>
  /** Simulasi backend: membuat akun klien dengan kata sandi sementara dan "mengirim" detailnya ke email. */
  provisionAccount: (input: { name: string; personName: string; email: string; phone: string }) => Promise<ProvisionedAccount>
  navigate: (path: string) => void
}

/** Data klien yang sudah login (alur dashboard). */
export interface MemberProfile {
  personName: string
  accountName: string
  /** Paket aktif saat sesi dimulai; null bila belum berlangganan. */
  activePlan: { planId: PlanId; periodEnd: string } | null
}

const RECOMMENDED_PLAN: PlanId = "starter"
const NEEDS = "Membalas chat WhatsApp yang menumpuk saat jam sibuk, menjawab pertanyaan menu, dan menerima pesanan ambil sendiri."
const OBSTACLES = "Belum memiliki akun WhatsApp Business API dan khawatir proses verifikasinya rumit."
const NEXT_ACTION =
  "Tim teknis menghubungi lewat WhatsApp dalam 1×24 jam untuk verifikasi WhatsApp Business API, lalu aktivasi chatbot dan katalog menu."

// Hasil transkripsi yang sengaja keliru untuk demo konfirmasi.
const HEARD_NAME = "Dimas Ardiansah" // huruf "y" hilang
const HEARD_EMAIL = "dimasardiansyah@gmail.com" // titik setelah "dimas" hilang
const HEARD_PHONE = "0812-3456-7890" // tertangkap benar
const BUSINESS_NAME = "Mbee Cafe"

function summary(partial: Partial<IssueSummary>): IssueSummary {
  return { overview: "", needs: "", obstacles: "", nextAction: "", sentiment: "neutral", ...partial }
}

/** Popup konfirmasi data yang rawan salah dengar: opsi tulisan agen + "Revisi" (terisi) + "Lainnya" (dari nol). */
function confirmQuestion(header: string, question: string, heard: string, kind: "text" | "email" | "phone", what: string) {
  return {
    header,
    question,
    options: [{ value: heard, label: heard, description: `Seperti yang ditulis ${ASSISTANT_NAME}` }],
    // 3 pilihan: tulisan agen / revisi (terisi, tinggal ubah) / lainnya (ketik dari nol)
    revise: { label: `Revisi ${what}`, placeholder: `Ubah ${what} yang sudah tertulis` },
    other: { label: `Lainnya, ketik ${what} dari awal`, placeholder: `Ketik ${what} yang benar`, kind },
  }
}

function confirmLabel(answer: QuestionAnswer, what: string) {
  return answer.custom ? `${what} dikoreksi pelanggan: ${answer.value}` : `${what} dikonfirmasi: ${answer.value}`
}

/** Opsi paket: rekomendasi di urutan pertama (pola AskUserQuestion). */
function planOptions() {
  const ordered = [...PLANS].sort((a, b) => (a.id === RECOMMENDED_PLAN ? -1 : b.id === RECOMMENDED_PLAN ? 1 : 0))
  return ordered.map((plan) => ({
    value: plan.id,
    label: plan.id === RECOMMENDED_PLAN ? `${plan.name} (Rekomendasi)` : plan.name,
    description: `${plan.monthlyPrice === null ? "Custom, dihubungi tim sales" : `${formatRupiah(plan.monthlyPrice)}/bln`} · ${plan.features.slice(0, 3).join(", ")}`,
  }))
}

// ─── Bagian percakapan yang dipakai kedua alur ────────────────────────────────

/** Rekomendasi → popup pilih paket → kartu paket → kendala WhatsApp Business API. */
async function choosePlan(ctx: ConversationContext): Promise<Plan> {
  ctx.stage("recommendation")
  const recommended = getPlan(RECOMMENDED_PLAN)
  await ctx.say(
    `Saya paham. Layanan ${PLATFORM_NAME} tersedia dalam paket bundling. Untuk chatbot menu dan pesanan dari chat, saya rekomendasikan paket ${recommended.name}. Silakan pilih paket yang ingin diaktifkan di layar ya, Kak.`
  )
  const planAnswer = await ctx.ask({
    header: "Pilih paket",
    question: "Paket layanan mana yang ingin diaktifkan?",
    options: planOptions(),
  })
  const plan = getPlan(planAnswer.value as PlanId)
  await ctx.updateTicket(
    { planId: plan.id, amount: plan.monthlyPrice ?? 0 },
    { stage: "recommendation", label: `Paket layanan dipilih: ${plan.name}` }
  )
  await ctx.say(`Paket ${plan.name} sudah saya catat.`, { attachment: { type: "plan", planId: plan.id } })
  await ctx.hear("Oke. Tapi saya belum punya WhatsApp Business API, ribet nggak ya?")
  await ctx.mood("confused", 1600)
  await ctx.updateTicket(
    { priority: "high", summary: summary({ needs: NEEDS, obstacles: OBSTACLES }) },
    { stage: "data", label: "Kendala dicatat: verifikasi WhatsApp Business API" }
  )
  await ctx.say("Tenang, Kak. Tim teknis kami akan mendampingi verifikasi WhatsApp Business sampai selesai. Kendalanya sudah saya catat.")
  return plan
}

/**
 * Pembayaran paket lewat dialog, dengan coba ulang bila gagal/dibatalkan.
 * Mengembalikan true bila lunas. Enterprise tidak lewat checkout (dihubungi tim sales).
 */
async function payForPlan(
  ctx: ConversationContext,
  plan: Plan,
  firstName: string,
  businessName: string,
  /** Upgrade: paket aktif sebelumnya dan tanggal berakhir periode yang tetap berlaku. */
  upgrade?: { from: Plan; periodEnd: string }
): Promise<boolean> {
  ctx.stage("payment")
  if (plan.monthlyPrice === null) {
    await ctx.updateTicket({}, { stage: "payment", label: "Menunggu penawaran paket Enterprise dari tim sales" })
    await ctx.say(
      `Untuk paket ${plan.name}, harganya disesuaikan kebutuhan. Tim sales ${PLATFORM_NAME} akan menghubungi Kakak lewat WhatsApp untuk penawaran.`
    )
    return false
  }

  const diff = upgrade ? upgradePrice(upgrade.from.id, plan.id) : null
  await ctx.say(
    upgrade && diff !== null
      ? `Untuk upgrade dari ${upgrade.from.name} ke ${plan.name}, Kakak cukup membayar selisihnya ${formatRupiah(diff)}, lebih murah dari harga normal ${formatRupiah(plan.monthlyPrice)}. Masa berlakunya tetap sampai ${formatDate(upgrade.periodEnd)}. Mau saya bantu aktifkan sekarang?`
      : `Supaya layanan bisa dipakai, paket ${plan.name} perlu diaktifkan dengan pembayaran ${formatRupiah(plan.monthlyPrice)} per bulan. Mau saya bantu aktifkan sekarang?`
  )
  await ctx.hear("Boleh, langsung saja.")
  await ctx.say("Baik, jendela pembayaran sudah saya buka. Silakan pilih metode dan selesaikan pembayarannya ya, Kak.")

  for (;;) {
    await ctx.updateTicket({ paymentStatus: "pending" }, { stage: "payment", label: `Tagihan paket ${plan.name} dibuat` })
    const result = await ctx.pay(plan.id, upgrade?.from.id)

    await ctx.say("Sebentar, saya cek status pembayarannya ya.")
    await ctx.mood("thinking", 1500)

    if (result.status === "paid") {
      const method = PAYMENT_METHOD_LABEL[result.method]
      const until = upgrade ? new Date(upgrade.periodEnd) : new Date()
      if (!upgrade) until.setMonth(until.getMonth() + 1)
      await ctx.updateTicket(
        { paymentMethod: result.method, paymentStatus: "paid" },
        { stage: "payment", label: `Pembayaran ${method} lunas · ${result.invoiceId}` }
      )
      await ctx.say(
        `Pembayaran lewat ${method} sebesar ${formatRupiah(result.amount)} sudah berhasil. Paket ${plan.name} ${businessName} aktif sampai ${formatDate(until.toISOString())}. Terima kasih, Kak ${firstName}!`,
        { mood: "happy" }
      )
      return true
    }

    if (result.status === "failed") {
      const method = PAYMENT_METHOD_LABEL[result.method]
      await ctx.updateTicket(
        { paymentMethod: result.method, paymentStatus: "failed" },
        { stage: "payment", label: `Pembayaran ${method} gagal: ${result.reason}` }
      )
      await ctx.mood("confused", 900)
      await ctx.say(
        `Maaf, Kak, pembayaran lewat ${method} belum berhasil karena ${result.reason}. Tenang, tidak ada dana yang terpotong. Kakak bisa coba lagi atau pilih metode lain.`
      )
    } else {
      await ctx.updateTicket({ paymentStatus: "unpaid" }, { stage: "payment", label: "Pembayaran dibatalkan pelanggan" })
      await ctx.say("Jendela pembayaran ditutup sebelum pembayaran selesai. Mau dicoba lagi sekarang?")
    }

    const retry = await ctx.ask({
      header: "Pembayaran",
      question: "Coba bayar lagi sekarang?",
      options: [
        { value: "retry", label: "Coba bayar lagi", description: "Buka lagi jendela pembayaran" },
        { value: "later", label: "Nanti saja", description: "Pembayaran bisa dilanjutkan nanti" },
      ],
    })
    if (retry.value !== "retry") return false
    await ctx.say("Baik, saya buka lagi jendela pembayarannya.")
  }
}

async function saveSummary(ctx: ConversationContext, plan: Plan, paid: boolean, businessName: string, extra = "") {
  ctx.stage("summary")
  const paymentNote = plan.monthlyPrice === null ? "menunggu penawaran Enterprise" : paid ? "sudah dibayar" : "belum dibayar"
  await ctx.updateTicket(
    {
      summary: summary({
        overview: `${businessName} ingin membalas chat lebih cepat dan menerima pesanan ambil sendiri lewat WhatsApp. Memilih paket ${plan.name} (${paymentNote}).${extra}`,
        needs: NEEDS,
        obstacles: OBSTACLES,
        nextAction: NEXT_ACTION,
        sentiment: paid ? "positive" : "neutral",
      }),
    },
    { stage: "summary", label: "Ringkasan sesi disimpan" }
  )
}

async function closing(ctx: ConversationContext, firstName: string, farewell?: string) {
  await ctx.say(`Ada hal lain yang bisa saya bantu, Kak ${firstName}?`)
  await ctx.hear(`Tidak ada, sudah cukup. Terima kasih, ${ASSISTANT_NAME}!`)
  await ctx.say(
    farewell ??
      `Sama-sama, Kak ${firstName}. Tim kami akan menghubungi lewat WhatsApp dalam 1×24 jam untuk verifikasi WhatsApp Business. Selamat datang di ${PLATFORM_NAME}!`,
    { mood: "happy" }
  )
}

// ─── Alur 1: pengunjung landing tanpa login ──────────────────────────────────

export async function landingConversation(ctx: ConversationContext): Promise<void> {
  // 1. Keluhan dan keinginan dulu, tanpa perlu daftar
  ctx.stage("greeting")
  await ctx.say(
    `Halo, selamat datang di ${PLATFORM_NAME}! Saya ${ASSISTANT_NAME}, asisten Voice AI. Ceritakan saja kendala usaha Anda, nanti saya bantu carikan paket yang pas. Tidak perlu daftar dulu.`,
    { mood: "happy" }
  )
  ctx.stage("discovery")
  await ctx.hear(
    `Halo ${ASSISTANT_NAME}. Saya punya kafe. Chat WhatsApp pelanggan sering menumpuk di jam makan siang, banyak yang tanya menu dan mau pesan untuk diambil, kadang telat kami balas.`
  )
  await ctx.updateTicket({ summary: summary({ needs: NEEDS }) }, { stage: "discovery", label: "Keluhan pelanggan tercatat" })
  await ctx.say("Jam makan siang memang padat ya, Kak. Kalau semuanya lancar, apa yang paling ingin Kakak capai?")
  await ctx.hear("Pertanyaan menu dijawab otomatis, dan pesanan dari chat langsung tercatat tanpa saya ketik ulang.")
  await ctx.updateTicket({}, { stage: "discovery", label: "Keinginan pelanggan tercatat: jawaban menu otomatis dan pesanan dari chat" })

  // 2. Paket layanan
  const plan = await choosePlan(ctx)

  // 3. Data untuk akun baru
  ctx.stage("data")
  await ctx.say(`Supaya paketnya bisa langsung aktif, saya buatkan akun ${PLATFORM_NAME} untuk Kakak. Boleh saya tahu nama lengkapnya?`)
  await ctx.hear(`Nama saya ${HEARD_NAME}.`)
  await ctx.say("Terima kasih. Supaya tidak salah tulis, mohon cek ejaan nama Kakak di layar ya.")
  const nameAnswer = await ctx.ask(confirmQuestion("Konfirmasi nama", "Apakah nama Anda sudah benar?", HEARD_NAME, "text", "nama"))
  const name = nameAnswer.value
  const firstName = name.split(" ")[0]
  await ctx.updateTicket({ name }, { stage: "data", label: confirmLabel(nameAnswer, "Nama") })
  await ctx.say(
    `${nameAnswer.custom ? "Maaf atas kesalahan ejaannya, sudah saya perbaiki. " : ""}Salam kenal, Kak ${firstName}! Apa nama usaha Kakak?`
  )

  await ctx.hear(`Nama usahanya ${BUSINESS_NAME}.`)
  await ctx.updateTicket({ companyName: BUSINESS_NAME, title: `Calon klien · ${BUSINESS_NAME}` })
  await ctx.say(
    `${BUSINESS_NAME}, mirip nama saya ya, sama-sama suara domba! Alamat email untuk akun ini apa, Kak? Detail masuknya nanti saya kirim ke sana.`
  )

  await ctx.hear("Emailnya dimas titik ardiansyah at gmail dot com.")
  await ctx.say("Email yang saya tangkap ada di layar. Mohon dicek ya, Kak.")
  const emailAnswer = await ctx.ask(confirmQuestion("Konfirmasi email", "Apakah email Anda sudah benar?", HEARD_EMAIL, "email", "email"))
  let email = emailAnswer.value
  await ctx.updateTicket({ email }, { stage: "data", label: confirmLabel(emailAnswer, "Email") })

  // Email yang sudah punya akun (dan tagihannya) tidak dipakai lagi: cukup diberi tahu, lalu pilih email lain
  // atau masuk ke akun itu. Pengecekan sebelum pembayaran, jadi tidak ada tagihan baru.
  let emailNote = emailAnswer.custom ? "Baik, email sudah saya perbaiki. " : "Baik, email tersimpan. "
  while (await ctx.emailTaken(email)) {
    await ctx.updateTicket({}, { stage: "data", label: `Email ${email} sudah terdaftar, tidak dipakai untuk akun baru` })
    const loginHref = `/login?email=${encodeURIComponent(email)}`
    await ctx.mood("confused", 900)
    await ctx.say(
      `Maaf, Kak, email ${email} sudah terdaftar di ${PLATFORM_NAME} dan akunnya sudah digunakan, jadi tidak bisa dipakai untuk membuat akun baru. Kakak bisa pakai email lain, atau masuk ke akun tersebut.`,
      { attachment: { type: "login", email, loginHref } }
    )
    const taken = await ctx.ask({
      header: "Email sudah terdaftar",
      question: "Mau lanjut dengan email lain?",
      options: [
        { value: "other", label: "Pakai email lain", description: "Buat akun baru dengan email berbeda" },
        { value: "login", label: "Masuk ke akun ini", description: "Tombol masuk ada di kartu, dibuka di tab baru" },
      ],
    })
    if (taken.value === "login") {
      await ctx.updateTicket(
        { summary: summary({ overview: `Email ${email} sudah punya akun, calon klien diarahkan masuk ke akun tersebut.`, nextAction: "Tidak ada tindak lanjut." }), issueStatus: "resolved" },
        { stage: "data", label: "Calon klien diarahkan masuk ke akun yang sudah ada" }
      )
      await ctx.say(
        `Baik, Kak. Silakan masuk lewat tombol di kartu tadi. Kalau mau naik paket, bisa dari halaman Penagihan atau minta bantuan saya lagi di dashboard. Sampai jumpa!`,
        { mood: "happy" }
      )
      return
    }
    await ctx.hear("Saya pakai email lain saja.")
    await ctx.say("Baik, silakan ketik email barunya di layar ya, Kak.")
    const typed = await ctx.ask({
      header: "Email baru",
      question: "Email apa yang ingin dipakai?",
      options: [],
      other: { label: "Ketik email baru", placeholder: "nama@email.com", kind: "email" },
    })
    email = typed.value
    await ctx.updateTicket({ email }, { stage: "data", label: `Email diganti pelanggan: ${email}` })
    emailNote = "Baik, email baru tersimpan. "
  }
  await ctx.say(`${emailNote}Terakhir, nomor WhatsApp yang bisa kami hubungi berapa?`)

  await ctx.hear("Nomornya 0812 3456 7890.")
  await ctx.say("Nomornya saya tampilkan di layar, mohon dikonfirmasi.")
  const phoneAnswer = await ctx.ask(
    confirmQuestion("Konfirmasi nomor", "Apakah nomor WhatsApp Anda sudah benar?", HEARD_PHONE, "phone", "nomor")
  )
  const phone = phoneAnswer.value
  await ctx.updateTicket({ phone }, { stage: "data", label: confirmLabel(phoneAnswer, "Nomor WhatsApp") })
  await ctx.updateTicket({}, { stage: "data", label: "Data akun lengkap" })
  await ctx.say(`Terima kasih, data akun ${BUSINESS_NAME} sudah lengkap.`)

  // 4. Pembayaran
  const paid = await payForPlan(ctx, plan, firstName, BUSINESS_NAME)

  // 5. Setelah lunas: backend membuat akun dengan kata sandi sementara
  let account: ProvisionedAccount | null = null
  if (paid) {
    ctx.stage("account")
    await ctx.say("Sekarang saya minta sistem membuatkan akun Kakak, sebentar ya.")
    await ctx.mood("thinking", 1600)
    account = await ctx.provisionAccount({ name: BUSINESS_NAME, personName: name, email, phone })
    await ctx.updateTicket(
      { title: `Onboarding akun · ${BUSINESS_NAME}` },
      { stage: "account", label: `Akun dibuat (${account.email}), kata sandi sementara dikirim ke email` }
    )
    await ctx.say(
      `Akun ${PLATFORM_NAME} untuk ${BUSINESS_NAME} sudah jadi. Email dan kata sandi sementaranya ada di layar, dan juga sudah saya kirim ke ${account.email}. Salin kata sandinya, lalu tekan Masuk ke Dashboard di kartu ini kapan saja. Demi keamanan, Kakak wajib mengganti kata sandi saat pertama masuk.`,
      { mood: "happy", attachment: { type: "credentials", ...account } }
    )
  } else if (plan.monthlyPrice !== null) {
    await ctx.say(`Baik, Kak. Akun ${PLATFORM_NAME} dibuat setelah pembayaran selesai. Tim kami akan menghubungi lewat WhatsApp untuk melanjutkannya.`)
  }

  await saveSummary(
    ctx,
    plan,
    paid,
    BUSINESS_NAME,
    account ? ` Akun dibuat lewat landing (${account.email}).` : " Belum punya akun, berasal dari landing."
  )

  // 6. Penutup. Masuk ke dashboard lewat tombol di kartu akun (bukan popup), supaya kata sandi
  //    sementara tetap terlihat dan bisa disalin sebelum pindah halaman.
  await closing(ctx, firstName)
}

// ─── Alur 2: klien yang sudah login di dashboard ─────────────────────────────

/**
 * Upgrade paket untuk klien yang sudah berlangganan. Hanya paket di atas paket aktif yang ditawarkan;
 * paket di bawahnya tidak bisa dibeli lagi (sama seperti kartu paket di Riwayat Penagihan).
 */
async function upgradeConversation(ctx: ConversationContext, profile: MemberProfile, current: Plan, firstName: string) {
  ctx.stage("discovery")
  await ctx.hear("Saya mau upgrade paket. Tim kami bertambah dan kursinya tidak cukup lagi.")
  await ctx.updateTicket(
    {
      template: "billing",
      paymentStatus: null,
      planId: current.id,
      title: `Upgrade paket · ${profile.accountName}`,
      summary: summary({ needs: "Kapasitas lebih besar (kursi dan saluran) karena tim bertambah." }),
    },
    { stage: "discovery", label: `Permintaan upgrade dari paket ${current.name}` }
  )

  const higher = higherPlans(current.id)
  const lower = lowerPlans(current.id)
  if (higher.length === 0) {
    await ctx.say(
      `Paket ${current.name} sudah paket tertinggi, Kak, jadi tidak ada yang perlu di-upgrade. Kalau kebutuhannya khusus, ${PLATFORM_TEAM} siap membantu lewat WhatsApp.`
    )
    ctx.stage("summary")
    await ctx.updateTicket({ issueStatus: "resolved" }, { stage: "summary", label: "Sudah di paket tertinggi, tidak ada upgrade" })
    await closing(ctx, firstName, `Sama-sama, Kak ${firstName}. Kabari saya kapan saja kalau butuh bantuan lagi!`)
    return
  }

  ctx.stage("recommendation")
  const next = higher[0]
  const lowerNote = lower.length > 0 ? `Paket di bawahnya (${lower.map((p) => p.name).join(", ")}) tidak bisa dibeli lagi. ` : ""
  await ctx.say(
    `Baik, Kak. Paket aktif Kakak sekarang ${current.name}. ${lowerNote}Yang bisa dipilih adalah paket di atasnya, dan saya rekomendasikan ${next.name}. Silakan pilih di layar ya.`
  )
  const answer = await ctx.ask({
    header: "Upgrade paket",
    question: `Naik dari ${current.name} ke paket mana?`,
    options: higher.map((plan, index) => {
      const diff = upgradePrice(current.id, plan.id)
      return {
        value: plan.id,
        label: index === 0 ? `${plan.name} (Rekomendasi)` : plan.name,
        description:
          diff === null
            ? "Custom, dihubungi tim sales"
            : `Bayar selisih ${formatRupiah(diff)} (normal ${formatRupiah(plan.monthlyPrice ?? 0)}/bln) · ${plan.features.slice(0, 2).join(", ")}`,
      }
    }),
  })
  const plan = getPlan(answer.value as PlanId)
  await ctx.updateTicket(
    { planId: plan.id, amount: plan.monthlyPrice ?? 0 },
    { stage: "recommendation", label: `Upgrade dipilih: ${current.name} → ${plan.name}` }
  )
  await ctx.say(`Upgrade ke paket ${plan.name} sudah saya catat.`, { attachment: { type: "plan", planId: plan.id } })

  const paid = await payForPlan(ctx, plan, firstName, profile.accountName, {
    from: current,
    periodEnd: profile.activePlan?.periodEnd ?? new Date().toISOString(),
  })
  if (!paid && plan.monthlyPrice !== null) {
    await ctx.say("Baik, Kak. Upgrade bisa dilanjutkan kapan saja dari halaman Riwayat Penagihan, tab Langganan.")
  }

  if (paid) {
    await ctx.say("Mau saya arahkan ke Riwayat Penagihan untuk melihat paket barunya, atau tetap di halaman ini?")
    const nav = await ctx.ask({
      header: "Halaman",
      question: "Pindah ke Riwayat Penagihan?",
      options: [
        { value: "history", label: "Buka Riwayat Penagihan", description: "Lihat paket baru dan invoice upgrade" },
        { value: "stay", label: "Tetap di sini", description: "Lanjutkan dari halaman ini" },
      ],
    })
    if (nav.value === "history") {
      ctx.navigate("/dashboard/billing/history")
      await ctx.say(`Sudah saya buka. Paket ${plan.name} aktif, dan invoice upgrade-nya ada di tab Riwayat.`)
    } else {
      await ctx.say("Baik, kita tetap di sini.")
    }
  }

  ctx.stage("summary")
  const paymentNote = plan.monthlyPrice === null ? "menunggu penawaran Enterprise" : paid ? "sudah dibayar" : "belum dibayar"
  await ctx.updateTicket(
    {
      summary: summary({
        overview: `${profile.accountName} upgrade dari paket ${current.name} ke ${plan.name} (${paymentNote}).`,
        needs: "Kapasitas lebih besar (kursi dan saluran) karena tim bertambah.",
        nextAction: paid ? `Tim memastikan fitur paket ${plan.name} aktif di akun.` : "Menunggu pembayaran upgrade atau penawaran dari tim sales.",
        sentiment: paid ? "positive" : "neutral",
      }),
    },
    { stage: "summary", label: "Ringkasan sesi disimpan" }
  )
  await closing(
    ctx,
    firstName,
    paid
      ? `Sama-sama, Kak ${firstName}. Paket ${plan.name} langsung aktif, dan ${PLATFORM_TEAM} siap membantu kalau ada kendala. Selamat berkembang!`
      : `Sama-sama, Kak ${firstName}. Kabari saya kapan saja kalau mau melanjutkan upgrade-nya!`
  )
}

export async function memberConversation(ctx: ConversationContext, profile: MemberProfile): Promise<void> {
  const firstName = profile.personName.split(" ")[0]
  ctx.stage("greeting")

  // Paket sudah aktif: paket di bawahnya tidak bisa dibeli lagi, paket di atasnya bisa di-upgrade.
  if (profile.activePlan) {
    const current = getPlan(profile.activePlan.planId)
    await ctx.say(
      `Halo Kak ${firstName}, selamat datang kembali! Paket ${current.name} ${profile.accountName} aktif sampai ${formatDate(profile.activePlan.periodEnd)}. Ada yang bisa saya bantu?`,
      { mood: "happy" }
    )
    const topic = await ctx.ask({
      header: "Topik",
      question: "Apa yang ingin dibantu?",
      options: [
        { value: "upgrade", label: "Upgrade paket", description: `Naik dari ${current.name} ke paket di atasnya` },
        { value: "whatsapp", label: "Status verifikasi WhatsApp Business", description: "Tanya progres ke tim teknis" },
      ],
    })

    if (topic.value === "upgrade") {
      await upgradeConversation(ctx, profile, current, firstName)
      return
    }

    await ctx.updateTicket({ template: "technical", paymentStatus: null, planId: current.id, title: `Pertanyaan klien · ${profile.accountName}` })
    ctx.stage("handling")
    await ctx.hear("Verifikasi WhatsApp Business API saya sudah sampai mana ya?")
    await ctx.updateTicket(
      {
        title: `Status verifikasi WhatsApp Business API · ${profile.accountName}`,
        priority: "medium",
        summary: summary({
          overview: `${profile.accountName} menanyakan status verifikasi WhatsApp Business API (paket ${current.name} aktif).`,
          needs: "Kepastian status verifikasi WhatsApp Business API.",
          nextAction: "Tim teknis mengabari status verifikasi lewat WhatsApp paling lambat 1×24 jam.",
        }),
      },
      { stage: "handling", label: "Pertanyaan dicatat: status verifikasi WhatsApp Business API" }
    )
    await ctx.say(
      `Pertanyaan Kakak sudah saya catat dan teruskan ke ${PLATFORM_TEAM}. Mereka akan mengabari status verifikasinya lewat WhatsApp paling lambat 1×24 jam.`
    )
    ctx.stage("summary")
    await ctx.updateTicket({}, { stage: "summary", label: "Ringkasan sesi disimpan" })
    await closing(ctx, firstName)
    return
  }

  // Belum berlangganan: alur pembelian paket seperti sebelumnya, data profil sudah ada di akun.
  await ctx.say(
    `Halo Kak ${firstName}, selamat datang kembali di ${PLATFORM_NAME}! Saya ${ASSISTANT_NAME}, asisten Voice AI. Ada yang bisa saya bantu untuk ${profile.accountName} hari ini?`,
    { mood: "happy" }
  )
  ctx.stage("discovery")
  await ctx.hear(
    "Saya mau mulai pakai chatbot. Chat WhatsApp sering menumpuk di jam makan siang, banyak yang tanya menu dan mau pesan untuk diambil, kadang telat kami balas."
  )
  await ctx.updateTicket({ summary: summary({ needs: NEEDS }) }, { stage: "discovery", label: "Kebutuhan pelanggan tercatat" })

  const plan = await choosePlan(ctx)
  const paid = await payForPlan(ctx, plan, firstName, profile.accountName)

  if (!paid && plan.monthlyPrice !== null) {
    await ctx.say("Baik, Kak. Paket bisa diaktifkan kapan saja dari menu Penagihan.")
  }

  // Setelah lunas: tawarkan pindah ke Riwayat Penagihan atau tetap di sini
  if (paid) {
    await ctx.say("Mau saya arahkan ke halaman Riwayat Penagihan untuk melihat buktinya, atau tetap di halaman ini?")
    const nav = await ctx.ask({
      header: "Halaman",
      question: "Pindah ke Riwayat Penagihan?",
      options: [
        { value: "history", label: "Buka Riwayat Penagihan", description: "Lihat invoice pembayaran barusan" },
        { value: "stay", label: "Tetap di sini", description: "Lanjutkan dari halaman ini" },
      ],
    })
    if (nav.value === "history") {
      ctx.navigate("/dashboard/billing/history")
      await ctx.say(`Sudah saya buka halaman Riwayat Penagihan. Paket ${plan.name} sudah aktif, dan invoice pembayarannya ada di tab Riwayat.`)
    } else {
      await ctx.say("Baik, kita tetap di sini.")
    }
  }

  await saveSummary(ctx, plan, paid, profile.accountName)
  await closing(ctx, firstName)
}
