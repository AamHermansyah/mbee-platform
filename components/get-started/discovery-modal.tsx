"use client"

/**
 * Porting dari mimin-workflow `app/(dashboard)/get-started/_components/discovery-modal.tsx`.
 * Perbedaan: teks dari `./strings` (bukan next-intl) dan prop `flat` (Button, Progress,
 * DialogContent) ditiru lewat className dari `./flat-controls`.
 */

import { useState, useMemo } from "react"
import { Sparkles, ArrowRight, ArrowLeft, Check, Clock, BookOpen, Mail, Megaphone, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { FLAT_PROGRESS, SURFACE_CLOSE_BUTTON, SURFACE_DIALOG_CONTENT, flatButton } from "./flat-controls"
import { t } from "./strings"

interface OptionDef {
  value: string
  labelKey: string
  recommends: string[]
}

interface QuestionDef {
  id: string
  titleKey: string
  subtitleKey: string
  options: OptionDef[]
}

interface ModuleDef {
  id: string
  titleKey: string
  color: string
  icon: React.ReactNode
  steps: number
  targetKey: string
}

interface IProps {
  onComplete: (modules: string[]) => void
  onClose: () => void
}

const DISCOVERY_QUESTIONS: QuestionDef[] = [
  {
    id: "q1",
    titleKey: "dm_q1_title",
    subtitleKey: "dm_q1_subtitle",
    options: [
      { value: "yes_buy", labelKey: "dm_q1_yes", recommends: ["oms"] },
      { value: "no_buy", labelKey: "dm_q1_no", recommends: [] },
    ],
  },
  {
    id: "q2",
    titleKey: "dm_q2_title",
    subtitleKey: "dm_q2_subtitle",
    options: [
      { value: "yes_book", labelKey: "dm_q2_yes", recommends: ["rms"] },
      { value: "no_book", labelKey: "dm_q2_no", recommends: [] },
    ],
  },
  {
    id: "q3",
    titleKey: "dm_q3_title",
    subtitleKey: "dm_q3_subtitle",
    options: [
      { value: "yes_track", labelKey: "dm_q3_yes", recommends: ["ticket"] },
      { value: "no_track", labelKey: "dm_q3_no", recommends: [] },
    ],
  },
  {
    id: "q4",
    titleKey: "dm_q4_title",
    subtitleKey: "dm_q4_subtitle",
    options: [
      { value: "yes_promo", labelKey: "dm_q4_yes", recommends: ["campaign"] },
      { value: "no_promo", labelKey: "dm_q4_no", recommends: [] },
    ],
  },
]

function computeRecommendedModules(answers: Record<string, string>): string[] {
  const set = new Set<string>()
  Object.entries(answers).forEach(([qid, val]) => {
    const q = DISCOVERY_QUESTIONS.find((qq) => qq.id === qid)
    const opt = q?.options.find((o) => o.value === val)
    ;(opt?.recommends || []).forEach((m) => set.add(m))
  })
  return [...set]
}

const MODULES: Record<string, ModuleDef> = {
  oms: {
    id: "oms",
    titleKey: "mg_order_management",
    color: "#ea580c",
    icon: <BookOpen className="size-4" strokeWidth={1.8} />,
    steps: 4,
    targetKey: "dm_oms_target",
  },
  rms: {
    id: "rms",
    titleKey: "mg_reservation_booking",
    color: "#7c3aed",
    icon: <Clock className="size-4" strokeWidth={1.8} />,
    steps: 3,
    targetKey: "dm_rms_target",
  },
  ticket: {
    id: "ticket",
    titleKey: "mg_ticketing",
    color: "#0284c7",
    icon: <Mail className="size-4" strokeWidth={1.8} />,
    steps: 2,
    targetKey: "dm_ticket_target",
  },
  campaign: {
    id: "campaign",
    titleKey: "mg_campaign_broadcast",
    color: "#db2777",
    icon: <Megaphone className="size-4" strokeWidth={1.8} />,
    steps: 1,
    targetKey: "dm_campaign_target",
  },
}

export default function DiscoveryModal({ onComplete, onClose }: IProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [confirmedModules, setConfirmedModules] = useState<string[]>([])

  const isQuestionPhase = step < DISCOVERY_QUESTIONS.length
  const currentQ = isQuestionPhase ? DISCOVERY_QUESTIONS[step] : null

  const recommended = useMemo(() => {
    return computeRecommendedModules(answers)
  }, [answers])

  const answerQuestion = (val: string) => {
    if (!currentQ) return
    const nextAnswers = { ...answers, [currentQ.id]: val }
    const nextStep = step + 1
    setAnswers(nextAnswers)
    setStep(nextStep)
    if (nextStep === DISCOVERY_QUESTIONS.length) {
      setConfirmedModules(computeRecommendedModules(nextAnswers))
    }
  }

  const handleBack = () => {
    if (step > 0) {
      if (step <= DISCOVERY_QUESTIONS.length) {
        const qid = DISCOVERY_QUESTIONS[step - 1]?.id
        if (qid) {
          setAnswers((prev) => {
            const next = { ...prev }
            delete next[qid]
            return next
          })
        }
      }
      setStep((s) => s - 1)
    }
  }

  const toggleModule = (id: string) => {
    setConfirmedModules((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const totalSteps = DISCOVERY_QUESTIONS.length + 1
  const progressPct = Math.round(((step + 1) / totalSteps) * 100)

  return (
    // Modal hanya dirender saat dibuka (parent), jadi state pertanyaan selalu mulai dari awal
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        // sm:max-w-md menimpa sm:max-w-sm bawaan DialogContent proyek ini (lebar tetap max-w-md)
        className={cn(SURFACE_DIALOG_CONTENT, "max-h-[90dvh] max-w-md gap-0 overflow-y-auto p-0", "sm:max-w-md")}
      >
        {/* Header */}
        <div className="px-4 pb-3 pt-4 pr-12">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold tracking-tight">{t("module_discovery")}</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                {isQuestionPhase
                  ? t("dm_question_of", { current: step + 1, total: DISCOVERY_QUESTIONS.length })
                  : t("your_recommendations")}
              </DialogDescription>
            </div>
          </div>
          <Progress value={progressPct} className={cn(FLAT_PROGRESS, "mt-3 h-1.5")} />
        </div>

        {/* Body */}
        <div className="min-h-[220px] px-4 pb-3 pt-2">
          {isQuestionPhase ? (
            <div>
              <h2 className="mb-1 text-base font-semibold leading-snug text-foreground">
                {t(currentQ!.titleKey)}
              </h2>
              <p className="mb-3 text-sm text-muted-foreground">{t(currentQ!.subtitleKey)}</p>
              <div className="flex flex-col gap-2">
                {currentQ!.options.map((opt) => (
                  <Button
                    key={opt.value}
                    variant="outline"
                    onClick={() => answerQuestion(opt.value)}
                    className={cn(
                      flatButton("outline"),
                      "h-auto justify-between whitespace-normal rounded-xl px-3.5 py-2.5 text-left"
                    )}
                  >
                    {t(opt.labelKey)}
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="mb-1 text-base font-semibold leading-snug text-foreground">
                {recommended.length > 0
                  ? t("dm_recommend_modules", { count: recommended.length, plural: recommended.length > 1 ? "s" : "" })
                  : t("dm_all_set")}
              </h2>
              <p className="mb-3 text-sm text-muted-foreground">
                {recommended.length > 0
                  ? t("dm_recommend_desc")
                  : t("dm_no_modules_desc")}
              </p>

              {recommended.length > 0 && (
                <div className="flex flex-col gap-2">
                  {recommended.map((modId) => {
                    const mod = MODULES[modId]
                    if (!mod) return null
                    const checked = confirmedModules.includes(modId)
                    return (
                      <label
                        key={modId}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors motion-reduce:transition-none",
                          "focus-within:ring-2 focus-within:ring-primary/40",
                          !checked && "border-border bg-white hover:bg-muted"
                        )}
                        style={
                          checked
                            ? { background: `${mod.color}12`, borderColor: `${mod.color}80` }
                            : undefined
                        }
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModule(modId)}
                          className="sr-only"
                        />
                        <div
                          aria-hidden
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md text-white transition-colors motion-reduce:transition-none",
                            !checked && "border-2 border-border bg-white"
                          )}
                          style={checked ? { background: mod.color } : undefined}
                        >
                          {checked && <Check className="size-3" strokeWidth={3.5} />}
                        </div>
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-full"
                          style={{ background: `${mod.color}1f`, color: mod.color }}
                        >
                          {mod.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground">{t(mod.titleKey)}</div>
                          <div className="text-xs text-muted-foreground">
                            {t("dm_module_steps_target", { steps: mod.steps, plural: mod.steps > 1 ? "s" : "", target: t(mod.targetKey) })}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(flatButton("ghost", "sm"), "text-muted-foreground")}
            onClick={step === 0 ? onClose : handleBack}
          >
            <ArrowLeft className="size-3.5" />
            {step === 0 ? t("cancel") : t("back")}
          </Button>
          {!isQuestionPhase && (
            <Button size="sm" className={flatButton("default", "sm")} onClick={() => onComplete(confirmedModules)}>
              {recommended.length === 0
                ? t("dm_finish_onboarding")
                : confirmedModules.length === 0
                  ? t("dm_skip_all_finish")
                  : t("dm_add_modules", { count: confirmedModules.length, plural: confirmedModules.length > 1 ? "s" : "" })}
              <ArrowRight className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Tombol tutup gaya `flat` mimin (pengganti tombol tutup bawaan DialogContent proyek ini) */}
        <DialogClose className={SURFACE_CLOSE_BUTTON}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
