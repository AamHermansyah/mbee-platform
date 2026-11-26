// "/dashboard" tidak punya isi sendiri: AuthGate (layout) mengarahkan ke beranda sesuai peran
// (klien → /dashboard/get-started, admin → /dashboard/ticket) atau ke /login bila belum masuk.
export default function DashboardIndexPage() {
  return null
}
