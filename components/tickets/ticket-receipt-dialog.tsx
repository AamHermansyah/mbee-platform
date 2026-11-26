"use client"

import { CircleCheck, Copy } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { BrandMark } from "@/components/shared/brand"
import { PriorityTag } from "@/components/tickets/ticket-badges"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ISSUE_CATEGORY_LABEL } from "@/lib/constants/ticket"
import { closeTicketReceipt, useTicketReceiptStore, type TicketReceipt } from "@/lib/stores/ticket-receipt-store"

/**
 * Bukti tiket kendala setelah dikirim lewat Voice AI. Gayanya sama dengan hasil
 * "Pembayaran Berhasil!" di dialog pembayaran, dan tidak ikut masuk transkrip.
 * Percakapan tetap berjalan di belakang; dialog tertutup sendiri atau lewat tombol Tutup.
 */

const AUTO_CLOSE_SECONDS = 10

function ReceiptBody({ receipt }: { receipt: TicketReceipt }) {
  const [countdown, setCountdown] = useState(AUTO_CLOSE_SECONDS)

  useEffect(() => {
    const timer = setInterval(() => setCountdown((n) => n - 1), 1000)
    const close = setTimeout(closeTicketReceipt, AUTO_CLOSE_SECONDS * 1000)
    return () => {
      clearInterval(timer)
      clearTimeout(close)
    }
  }, [])

  const copyId = () => {
    void navigator.clipboard
      ?.writeText(receipt.ticketId)
      .then(() => toast.success("Nomor tiket disalin"))
      .catch(() => toast.info("Salin nomor tiket secara manual."))
  }

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-8 text-center" role="status" aria-live="polite">
      <span className="flex size-20 items-center justify-center rounded-full bg-green-100">
        <CircleCheck className="size-10 text-green-600" />
      </span>
      <div>
        <p className="text-2xl font-bold text-green-600">Tiket Berhasil Dikirim!</p>
        <p className="mt-1 text-sm text-slate-700">Kendala Anda sudah diteruskan ke tim. Simpan nomor tiket untuk menanyakan perkembangannya.</p>
      </div>
      <dl className="grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl bg-muted px-4 py-3 text-left text-xs">
        <dt className="text-slate-500">No. tiket</dt>
        <dd className="flex items-center justify-end gap-1 font-mono text-slate-900">
          {receipt.ticketId}
          <Button variant="ghost" size="icon-xs" onClick={copyId} aria-label="Salin nomor tiket">
            <Copy />
          </Button>
        </dd>
        <dt className="text-slate-500">Kendala</dt>
        <dd className="text-right font-semibold text-slate-900">{receipt.title}</dd>
        <dt className="text-slate-500">Kategori</dt>
        <dd className="text-right text-slate-900">{ISSUE_CATEGORY_LABEL[receipt.category]}</dd>
        <dt className="text-slate-500">Urgensi</dt>
        <dd className="flex justify-end">
          <PriorityTag priority={receipt.priority} />
        </dd>
        <dt className="text-slate-500">Target respons</dt>
        <dd className="text-right text-slate-900">{receipt.responseLabel}</dd>
        <dt className="text-slate-500">Konfirmasi</dt>
        <dd className={receipt.emailSent ? "text-right text-slate-900" : "text-right text-amber-700"}>
          {receipt.emailSent ? `Dikirim ke ${receipt.email}` : "Email gagal terkirim, tim menghubungi lewat WhatsApp"}
        </dd>
      </dl>
      {receipt.summary && (
        <div className="w-full rounded-xl border border-border px-4 py-3 text-left">
          <p className="text-[11px] font-medium text-slate-500">Ringkasan kendala</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-800">{receipt.summary}</p>
        </div>
      )}
      <div className="w-full space-y-1.5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
            style={{ width: `${(Math.max(countdown, 0) / AUTO_CLOSE_SECONDS) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">Jendela ini tertutup otomatis dalam {Math.max(countdown, 0)} detik.</p>
          <Button size="sm" variant="outline" onClick={closeTicketReceipt}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TicketReceiptDialog() {
  const receipt = useTicketReceiptStore((s) => s.receipt)

  return (
    <Dialog open={!!receipt} onOpenChange={(open) => !open && closeTicketReceipt()}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        {receipt && (
          <>
            <div className="flex items-center gap-3 border-b px-5 py-3.5">
              <BrandMark />
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base">Tiket Kendala</DialogTitle>
                <DialogDescription className="font-mono text-[11px]">{receipt.ticketId}</DialogDescription>
              </div>
            </div>
            <ReceiptBody key={receipt.ticketId} receipt={receipt} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
