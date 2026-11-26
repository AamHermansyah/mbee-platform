"use client"

import { ChevronDown, ChevronUp, CornerDownLeft } from "lucide-react"
import { AnimatePresence, motion, useDragControls } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import type { QuestionAnswer, VoiceQuestion } from "@/lib/stores/voice-store"
import { cn } from "@/lib/utils"

type InputKind = "text" | "email" | "phone"

/** Validasi isian "Revisi"/"Lainnya" sesuai jenisnya; null = valid. */
function validateCustom(kind: InputKind, raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  if (kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return "Format email belum benar, contoh: nama@email.com"
  }
  if (kind === "phone") {
    const digits = value.replace(/\D/g, "")
    if (!/^(0|62)/.test(digits) || digits.length < 10 || digits.length > 14) {
      return "Nomor telepon 10–14 digit, diawali 0 atau +62"
    }
  }
  return null
}

const NUMBER_BASE = "flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold"

/** Satu opsi dengan kolom isian di bawah labelnya ("Revisi" dan "Lainnya"). */
function InputOption({
  index,
  active,
  label,
  placeholder,
  kind,
  value,
  error,
  inputRef,
  onSelect,
  onChange,
  onBlur,
}: {
  index: number
  active: boolean
  label: string
  placeholder: string
  kind: InputKind
  value: string
  error: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onSelect: () => void
  onChange: (value: string) => void
  onBlur: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors duration-150",
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
      )}
      onClick={onSelect}
    >
      <span
        className={cn(NUMBER_BASE, "mt-1.5", active ? "border-primary bg-primary text-primary-foreground" : "border-border text-slate-600")}
        aria-hidden
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <button type="button" role="radio" aria-checked={active} onClick={onSelect} className="block text-left text-sm font-medium text-slate-900">
          {label}
        </button>
        <input
          ref={inputRef}
          value={value}
          // type "text": input email/tel tidak mendukung setSelectionRange (kursor di akhir teks saat Revisi).
          // Format divalidasi sendiri; inputMode tetap memunculkan keyboard email/telepon di ponsel.
          type="text"
          inputMode={kind === "email" ? "email" : kind === "phone" ? "tel" : "text"}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onSelect}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-invalid={active && !!error}
          className={cn(
            "mt-1 h-8 w-full rounded-md border bg-white px-2.5 text-sm text-slate-900 outline-none focus-visible:ring-2",
            active && error
              ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200"
              : "border-input focus-visible:border-primary focus-visible:ring-primary/20"
          )}
        />
        {active && error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
      </div>
    </div>
  )
}

/** Jarak tarik (px) pegangan drawer untuk memperkecil/membuka. */
const DRAG_TOGGLE_PX = 40

/**
 * Popup pertanyaan dari agen, pola seperti AskUserQuestion di Claude Code.
 * Tampil sebagai drawer di bawah transkrip: bisa diperkecil (tombol ⌄, klik judul, atau tarik pegangan
 * ke bawah) supaya transkrip tetap terbaca selama berdiskusi dengan Voice AI, lalu dibuka lagi.
 * Urutan opsi: pilihan agen (bernomor) → "Revisi" (isian sudah terisi nilai pilihan pertama, tinggal
 * diubah) → "Lainnya" (isian kosong, ketik dari nol). Bisa dipakai dengan keyboard
 * (angka untuk memilih, panah atas/bawah, Enter untuk kirim).
 */
export function QuestionPrompt({
  question,
  onAnswer,
}: {
  question: VoiceQuestion
  onAnswer: (answer: QuestionAnswer) => void
}) {
  const reviseIndex = question.revise ? question.options.length : -1
  const otherIndex = question.other ? question.options.length + (question.revise ? 1 : 0) : -1
  const total = question.options.length + (question.revise ? 1 : 0) + (question.other ? 1 : 0)
  const kind = question.other?.kind ?? "text"
  const original = question.options[0]?.value ?? ""

  const [collapsed, setCollapsed] = useState(false)
  const dragControls = useDragControls()
  // Klik setelah menarik pegangan tidak dihitung sebagai toggle
  const draggedRef = useRef(false)
  const [selected, setSelected] = useState(0)
  const [revised, setRevised] = useState(original)
  const [custom, setCustom] = useState("")
  const [touched, setTouched] = useState(false)
  const reviseRef = useRef<HTMLInputElement>(null)
  const otherRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const isRevise = selected === reviseIndex
  const isOther = selected === otherIndex
  const inputValue = isRevise ? revised : custom
  const inputError = (isRevise || isOther) && touched ? validateCustom(kind, inputValue) : null
  const canSubmit = !(isRevise || isOther) || (inputValue.trim().length > 0 && !validateCustom(kind, inputValue))

  useEffect(() => {
    if (collapsed) return
    if (isRevise) {
      const input = reviseRef.current
      input?.focus()
      // kursor di akhir teks supaya langsung bisa mengedit
      input?.setSelectionRange(input.value.length, input.value.length)
    } else if (isOther) otherRef.current?.focus()
    else rootRef.current?.focus()
  }, [isRevise, isOther, collapsed])

  const submit = () => {
    setTouched(true)
    if (!canSubmit) return
    if (isRevise || isOther) {
      const value = inputValue.trim()
      // Revisi yang tidak diubah sama dengan memilih tulisan agen
      onAnswer({ value, label: value, custom: value !== original || isOther })
    } else {
      const option = question.options[selected]
      onAnswer({ value: option.value, label: option.label, custom: false })
    }
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (collapsed) {
      // Drawer diperkecil: Enter/panah atas membuka lagi, tidak langsung mengirim jawaban
      if (event.key === "Enter" || event.key === "ArrowUp") {
        event.preventDefault()
        setCollapsed(false)
      }
      return
    }
    const typing = event.target instanceof HTMLInputElement
    if (event.key === "Enter") {
      event.preventDefault()
      submit()
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      setSelected((s) => (s + 1) % total)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setSelected((s) => (s - 1 + total) % total)
    } else if (!typing && /^[1-9]$/.test(event.key) && Number(event.key) <= total) {
      setSelected(Number(event.key) - 1)
    }
  }

  return (
    <motion.div
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-label={question.header}
      onKeyDown={onKeyDown}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.18 }}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.25}
      onDragStart={() => {
        draggedRef.current = true
      }}
      onDragEnd={(_, info) => {
        if (info.offset.y > DRAG_TOGGLE_PX) setCollapsed(true)
        else if (info.offset.y < -DRAG_TOGGLE_PX) setCollapsed(false)
      }}
      className="absolute inset-x-2 bottom-2 z-20 rounded-xl border border-border bg-white shadow-xl outline-none"
    >
      {/* Pegangan drawer: tarik ke bawah untuk memperkecil, ke atas untuk membuka */}
      <div
        onPointerDown={(event) => dragControls.start(event)}
        onClick={() => {
          if (draggedRef.current) {
            draggedRef.current = false
            return
          }
          setCollapsed((c) => !c)
        }}
        className="flex touch-none justify-center pt-1.5 pb-0.5"
        style={{ cursor: "grab" }}
        aria-hidden
      >
        <span className="rounded-full" style={{ width: 36, height: 4, backgroundColor: "#cbd5e1" }} />
      </div>

      <div className="flex items-start gap-2 px-3 pb-1">
        <button type="button" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed} className="min-w-0 flex-1 text-left outline-none">
          <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
            {question.header}
          </span>
          <span className={cn("mt-1 block text-sm font-semibold text-slate-900", collapsed && "truncate")}>{question.question}</span>
          {collapsed && <span className="block text-[11px] text-slate-500">Pilihan diperkecil, ketuk untuk membuka</span>}
        </button>
        <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Buka pilihan" : "Perkecil pilihan"}>
          {collapsed ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="custom-scrollbar max-h-[min(360px,50dvh)] overflow-y-auto px-3 pb-3">
              <div role="radiogroup" aria-label={question.question} className="mt-1.5 flex flex-col gap-1.5">
                {question.options.map((option, index) => {
                  const active = selected === index
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelected(index)}
                      onDoubleClick={submit}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors duration-150",
                        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                      )}
                    >
                      <span
                        className={cn(NUMBER_BASE, "mt-0.5", active ? "border-primary bg-primary text-primary-foreground" : "border-border text-slate-600")}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium break-words text-slate-900">{option.label}</span>
                        {option.description && <span className="block text-[11px] text-slate-600">{option.description}</span>}
                      </span>
                    </button>
                  )
                })}

                {question.revise && (
                  <InputOption
                    index={reviseIndex}
                    active={isRevise}
                    label={question.revise.label}
                    placeholder={question.revise.placeholder}
                    kind={kind}
                    value={revised}
                    error={inputError}
                    inputRef={reviseRef}
                    onSelect={() => setSelected(reviseIndex)}
                    onChange={(value) => {
                      setRevised(value)
                      setSelected(reviseIndex)
                    }}
                    onBlur={() => revised && setTouched(true)}
                  />
                )}

                {question.other && (
                  <InputOption
                    index={otherIndex}
                    active={isOther}
                    label={question.other.label}
                    placeholder={question.other.placeholder}
                    kind={kind}
                    value={custom}
                    error={inputError}
                    inputRef={otherRef}
                    onSelect={() => setSelected(otherIndex)}
                    onChange={(value) => {
                      setCustom(value)
                      setSelected(otherIndex)
                    }}
                    onBlur={() => custom && setTouched(true)}
                  />
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="hidden text-[10px] text-slate-500 sm:block">Angka untuk memilih · Enter untuk kirim</p>
                <Button size="sm" onClick={submit} disabled={!canSubmit} className="ml-auto">
                  Kirim <CornerDownLeft />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
