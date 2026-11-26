/** Bentuk data menu wajib dari mimin-workflow `api/use-get-required-menu.tsx` (hanya tipe). */
export interface RequiredMenu {
  _id: string
  nama_menu: string
  is_completed: boolean
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  __v: number
}
