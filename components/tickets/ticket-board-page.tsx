"use client"

import { ChevronDown, Ellipsis, Filter, Plus, RotateCcw, Search, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { KanbanView } from "@/components/tickets/kanban-view"
import { TicketDetailSheet } from "@/components/tickets/ticket-detail-sheet"
import { TicketFormDialog } from "@/components/tickets/ticket-form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ISSUE_STATUS_LABEL, PRIORITIES, PRIORITY_LABEL, TEMPLATE_LABEL, TEMPLATES } from "@/lib/constants/ticket"
import { ticketRepository, useTickets } from "@/lib/data/ticket-repository"
import { useAccountStore } from "@/lib/stores/account-store"
import { useBillingStore } from "@/lib/stores/billing-store"
import { useVoiceStore } from "@/lib/stores/voice-store"
import type { IssueStatus, Priority, Ticket, TicketTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Pil sub-menu Tiket/Template (pillTabClassName di mimin). */
const pillTab = (active: boolean) =>
  cn(
    "flex shrink-0 items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/50",
    active
      ? "border border-primary bg-primary text-primary-foreground hover:bg-primary/95"
      : "border border-border bg-white text-slate-600 hover:bg-muted hover:text-slate-900"
  )

export function TicketBoardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get("ticket_id")

  const tickets = useTickets()
  // Tiket yang sedang diisi Voice AI: dari sesi di tab ini, atau dari tab klien lain.
  const localLiveId = useVoiceStore((s) => (s.callStatus === "active" || s.callStatus === "connecting" ? s.ticketId : null))
  const remoteLiveId = useRemoteLiveTicketId(tickets)
  const liveTicketId = localLiveId ?? remoteLiveId

  const [query, setQuery] = useState("")
  const [templates, setTemplates] = useState<TicketTemplate[]>([])
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ticket | undefined>()
  const [deleting, setDeleting] = useState<Ticket | undefined>()

  const filtersActive = templates.length + priorities.length > 0
  const selected = tickets.find((t) => t.id === selectedId)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tickets
      .filter((t) => templates.length === 0 || templates.includes(t.template))
      .filter((t) => priorities.length === 0 || (t.priority !== null && priorities.includes(t.priority)))
      .filter((t) => !q || [t.id, t.title, t.name, t.email, t.phone, t.companyName].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [tickets, query, templates, priorities])

  const setTicketParam = (id: string | null) => {
    router.replace(id ? `${pathname}?ticket_id=${id}` : pathname, { scroll: false })
  }

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const moveTicket = async (ticketId: string, status: IssueStatus) => {
    await ticketRepository.update(ticketId, { issueStatus: status }, {
      stage: "handling",
      label: `Status diubah ke ${ISSUE_STATUS_LABEL[status]}`,
    })
    toast.success("Tiket berhasil dipindahkan", { description: `${ticketId} → ${ISSUE_STATUS_LABEL[status]}` })
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await ticketRepository.remove(deleting.id)
    toast.success(`Tiket ${deleting.id} dihapus`)
    if (selectedId === deleting.id) setTicketParam(null)
    setDeleting(undefined)
  }

  const resetFilters = () => {
    setTemplates([])
    setPriorities([])
  }

  return (
    <div className="flex w-full flex-col gap-3 pb-10 text-foreground sm:gap-4">
      <div className="flex w-full items-end justify-between gap-2">
        <h1 className="text-lg font-semibold sm:text-xl">Tiket</h1>
        <div className="flex items-center gap-2">
          <Button
            className="gap-2 text-xs sm:text-sm"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4 sm:size-5" />
            <span className="hidden sm:inline">Tambah Tiket</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Aksi lain">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  void ticketRepository.resetToSample()
                  useBillingStore.getState().reset()
                  useAccountStore.getState().reset()
                  setTicketParam(null)
                  toast.success("Data contoh dipulihkan", {
                    description: "Tiket, riwayat tagihan, dan akun yang dibuat Voice AI di landing dikembalikan ke awal.",
                  })
                }}
              >
                <RotateCcw /> Pulihkan data contoh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="hidden-scrollbar -m-0.5 flex flex-nowrap items-center gap-2 overflow-auto p-0.5">
        <button type="button" className={pillTab(true)} aria-current="page">
          Tiket
        </button>
        <button type="button" className={pillTab(false)} onClick={() => toast.info("Template tiket belum tersedia di versi demo.")}>
          Template
        </button>
      </div>

      <div className="flex w-full flex-col gap-3 p-px lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Masukan kata kunci"
            aria-label="Cari tiket"
            className="h-8 rounded-full bg-white pl-8 text-xs md:text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filtersActive && (
            <Button variant="outline" className="h-8 gap-2 text-xs" onClick={resetFilters}>
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={filtersActive ? "default" : "outline"} className="h-8 gap-2 text-xs">
                <Filter className="size-3.5" /> Filter
                {filtersActive && (
                  <span className="h-4 min-w-4 rounded-full bg-white px-1 text-[11px] font-semibold text-primary">
                    {templates.length + priorities.length}
                  </span>
                )}
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Template</DropdownMenuLabel>
              {TEMPLATES.map((t) => (
                <DropdownMenuCheckboxItem
                  key={t}
                  checked={templates.includes(t)}
                  onCheckedChange={() => setTemplates((list) => toggle(list, t))}
                  onSelect={(e) => e.preventDefault()}
                >
                  {TEMPLATE_LABEL[t]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Prioritas</DropdownMenuLabel>
              {PRIORITIES.map((p) => (
                <DropdownMenuCheckboxItem
                  key={p}
                  checked={priorities.includes(p)}
                  onCheckedChange={() => setPriorities((list) => toggle(list, p))}
                  onSelect={(e) => e.preventDefault()}
                >
                  {PRIORITY_LABEL[p]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filtersActive && (
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <span key={t} className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-white pr-1 pl-3 text-xs">
              {TEMPLATE_LABEL[t]}
              <button type="button" onClick={() => setTemplates((l) => l.filter((v) => v !== t))} className="flex size-6 items-center justify-center rounded-full hover:bg-muted" aria-label={`Hapus filter ${TEMPLATE_LABEL[t]}`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
          {priorities.map((p) => (
            <span key={p} className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-white pr-1 pl-3 text-xs">
              Prioritas {PRIORITY_LABEL[p]}
              <button type="button" onClick={() => setPriorities((l) => l.filter((v) => v !== p))} className="flex size-6 items-center justify-center rounded-full hover:bg-muted" aria-label={`Hapus filter prioritas ${PRIORITY_LABEL[p]}`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <KanbanView
        tickets={filtered}
        selectedId={selectedId}
        liveTicketId={liveTicketId}
        onMove={(id, status) => void moveTicket(id, status)}
        onOpen={(t) => setTicketParam(t.id)}
        onEdit={(t) => {
          setEditing(t)
          setFormOpen(true)
        }}
        onDelete={setDeleting}
      />

      <TicketDetailSheet
        ticket={selected}
        live={!!selected && selected.id === liveTicketId}
        onOpenChange={(open) => !open && setTicketParam(null)}
        onEdit={(t) => {
          setEditing(t)
          setFormOpen(true)
        }}
        onDelete={setDeleting}
      />

      <TicketFormDialog open={formOpen} onOpenChange={setFormOpen} ticket={editing} onSaved={(saved) => setTicketParam(saved.id)} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus tiket {deleting?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tiket “{deleting?.title}” akan dihapus. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * Tiket Voice AI yang masih "hidup" dari tab lain: sesi belum menulis ringkasan
 * dan baru diperbarui beberapa detik lalu. Jam diperbarui tiap 3 detik.
 */
function useRemoteLiveTicketId(tickets: Ticket[]): string | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3000)
    return () => clearInterval(timer)
  }, [])
  return useMemo(() => recentVoiceTicketId(tickets, now), [tickets, now])
}

function recentVoiceTicketId(tickets: Ticket[], now: number): string | null {
  const live = tickets.find(
    (t) =>
      t.source === "voice_ai" &&
      t.template === "onboarding_payment" &&
      !t.journey.some((e) => e.stage === "summary" || e.label === "Sesi diakhiri sebelum selesai") &&
      now - new Date(t.updatedAt).getTime() < 15_000
  )
  return live?.id ?? null
}
