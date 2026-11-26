"use client"

/**
 * Porting dari mimin-workflow `app/(dashboard)/get-started/_components/get-started-client.tsx`.
 * Perbedaan dengan aslinya:
 * - teks dari `./strings` (bukan next-intl); nama platform = PLATFORM_NAME;
 * - prop `flat` Button dan varian Badge ditiru lewat className dari `./flat-controls`;
 * - versi demo: tombol langkah (selain Penemuan) menampilkan notifikasi karena halaman
 *   tujuannya belum ada, alih-alih router.push ke halaman 404.
 */

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Brain,
  Sparkles,
  Clock,
  Check,
  ArrowRight,
  Rocket,
  Link as LinkIcon,
  CalendarDays,
  Ticket,
  Megaphone,
  Package,
  Tag,
  Settings,
  Users,
  Smartphone,
  Key,
  UserPlus,
  ShieldCheck,
  Inbox,
  Search,
  Star,
  CircleCheckBig,
  Layers,
  GitBranch,
  SquarePlus,
  DollarSign,
  LayoutGrid,
  ConciergeBell,
  Eye,
  FileText,
  CirclePlus,
  Zap,
  Type,
  MessageSquare,
  Send,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OnboardingHero } from "./onboarding-hero"
import { PanelContainer, SurfaceCard, SURFACE_PILL } from "./flat-surface"
import { Bone } from "./bone"
import { BADGE_BASE, flatButton } from "./flat-controls"
import type { RequiredMenu } from "./required-menu"
import DiscoveryModal from "./discovery-modal"
import { DEMO_PAGE_UNAVAILABLE, t } from "./strings"

const DISCOVERY_STORAGE_KEY = "mimin_discovery_completed"
const MODULES_STORAGE_KEY = "mimin_selected_modules"
const COMPLETED_STEPS_KEY = "mimin_completed_module_steps"
const SKIPPED_STEPS_KEY = "mimin_skipped_steps"

interface IProps {
  menus: RequiredMenu[]
}

interface StepDef {
  id: string
  menuKey: string | null
  isModuleStep?: boolean
  moduleGroupKey?: string
  icon: React.ReactNode
  titleKey: string
  descKey: string
  bulletKeys: { textKey: string; icon: React.ReactNode }[]
  durationKey: string
  ctaKey: string
  href: string
}

interface Step {
  id: string
  menuKey: string | null
  isModuleStep?: boolean
  moduleGroup?: string
  moduleGroupKey?: string
  icon: React.ReactNode
  label: string
  title: string
  description: string
  bullets: { text: string; icon: React.ReactNode }[]
  duration: string
  cta: string
  href: string
}

const CORE_STEPS: StepDef[] = [
  {
    id: "agent",
    menuKey: "chatbot-agent-gen-ai",
    icon: <Brain className="w-5 h-5" />,
    titleKey: "gs_agent_title",
    descKey: "gs_agent_desc",
    bulletKeys: [
      { textKey: "gs_agent_b1", icon: <Type className="w-3.5 h-3.5" /> },
      { textKey: "gs_agent_b2", icon: <Sparkles className="w-3.5 h-3.5" /> },
      { textKey: "gs_agent_b3", icon: <CircleCheckBig className="w-3.5 h-3.5" /> },
    ],
    durationKey: "gs_agent_duration",
    ctaKey: "gs_agent_cta",
    href: "/chatbot?action=create",
  },
  {
    id: "inbox",
    menuKey: "inbox-omnichannel",
    icon: <LinkIcon className="w-5 h-5" />,
    titleKey: "gs_inbox_title",
    descKey: "gs_inbox_desc",
    bulletKeys: [
      { textKey: "gs_inbox_b1", icon: <Smartphone className="w-3.5 h-3.5" /> },
      { textKey: "gs_inbox_b2", icon: <Key className="w-3.5 h-3.5" /> },
      { textKey: "gs_inbox_b3", icon: <LinkIcon className="w-3.5 h-3.5" /> },
    ],
    durationKey: "gs_inbox_duration",
    ctaKey: "gs_inbox_cta",
    href: "/setting?tab=channel",
  },
  {
    id: "human-agent",
    menuKey: "user",
    icon: <Users className="w-5 h-5" />,
    titleKey: "gs_team_title",
    descKey: "gs_team_desc",
    bulletKeys: [
      { textKey: "gs_team_b1", icon: <UserPlus className="w-3.5 h-3.5" /> },
      { textKey: "gs_team_b2", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
      { textKey: "gs_team_b3", icon: <Inbox className="w-3.5 h-3.5" /> },
    ],
    durationKey: "gs_team_duration",
    ctaKey: "gs_team_cta",
    href: "/users?action=create",
  },
  {
    id: "discovery",
    menuKey: null,
    icon: <Sparkles className="w-5 h-5" />,
    titleKey: "gs_discovery_title",
    descKey: "gs_discovery_desc",
    bulletKeys: [
      { textKey: "gs_discovery_b1", icon: <Search className="w-3.5 h-3.5" /> },
      { textKey: "gs_discovery_b2", icon: <Star className="w-3.5 h-3.5" /> },
      { textKey: "gs_discovery_b3", icon: <Settings className="w-3.5 h-3.5" /> },
    ],
    durationKey: "gs_discovery_duration",
    ctaKey: "gs_discovery_cta",
    href: "/get-started",
  },
]

const MODULE_STEPS_DATA: Record<string, Omit<StepDef, "menuKey">[]> = {
  oms: [
    {
      id: "oms-cat",
      isModuleStep: true,
      moduleGroupKey: "mg_order_management",
      icon: <Tag className="w-5 h-5" />,
      titleKey: "gs_oms_cat_title",
      descKey: "gs_oms_cat_desc",
      bulletKeys: [
        { textKey: "gs_oms_cat_b1", icon: <Layers className="w-3.5 h-3.5" /> },
        { textKey: "gs_oms_cat_b2", icon: <GitBranch className="w-3.5 h-3.5" /> },
        { textKey: "gs_oms_cat_b3", icon: <Package className="w-3.5 h-3.5" /> },
      ],
      durationKey: "gs_oms_cat_duration",
      ctaKey: "gs_oms_cat_cta",
      href: "/product?tab=product_category&action=create",
    },
    {
      id: "oms-prod",
      isModuleStep: true,
      moduleGroupKey: "mg_order_management",
      icon: <Package className="w-5 h-5" />,
      titleKey: "gs_oms_prod_title",
      descKey: "gs_oms_prod_desc",
      bulletKeys: [
        { textKey: "gs_oms_prod_b1", icon: <SquarePlus className="w-3.5 h-3.5" /> },
        { textKey: "gs_oms_prod_b2", icon: <DollarSign className="w-3.5 h-3.5" /> },
        { textKey: "gs_oms_prod_b3", icon: <Tag className="w-3.5 h-3.5" /> },
      ],
      durationKey: "gs_oms_prod_duration",
      ctaKey: "gs_oms_prod_cta",
      href: "/product?action=create",
    },
  ],
  rms: [
    {
      id: "rms-cfg",
      isModuleStep: true,
      moduleGroupKey: "mg_reservation_booking",
      icon: <Settings className="w-5 h-5" />,
      titleKey: "gs_rms_cfg_title",
      descKey: "gs_rms_cfg_desc",
      bulletKeys: [
        { textKey: "gs_rms_cfg_b1", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
        { textKey: "gs_rms_cfg_b2", icon: <ConciergeBell className="w-3.5 h-3.5" /> },
        { textKey: "gs_rms_cfg_b3", icon: <Clock className="w-3.5 h-3.5" /> },
      ],
      durationKey: "gs_rms_cfg_duration",
      ctaKey: "gs_rms_cfg_cta",
      href: "/reservation/calendar?skip_onboarding=1",
    },
    {
      id: "rms-cal",
      isModuleStep: true,
      moduleGroupKey: "mg_reservation_booking",
      icon: <CalendarDays className="w-5 h-5" />,
      titleKey: "gs_rms_cal_title",
      descKey: "gs_rms_cal_desc",
      bulletKeys: [
        { textKey: "gs_rms_cal_b1", icon: <Eye className="w-3.5 h-3.5" /> },
        { textKey: "gs_rms_cal_b2", icon: <CalendarDays className="w-3.5 h-3.5" /> },
        { textKey: "gs_rms_cal_b3", icon: <Bell className="w-3.5 h-3.5" /> },
      ],
      durationKey: "gs_rms_cal_duration",
      ctaKey: "gs_rms_cal_cta",
      href: "/reservation/calendar?skip_onboarding=1&action=connect_calendar",
    },
  ],
  ticket: [
    {
      id: "ticket-tpl",
      isModuleStep: true,
      moduleGroupKey: "mg_ticketing",
      icon: <FileText className="w-5 h-5" />,
      titleKey: "gs_ticket_tpl_title",
      descKey: "gs_ticket_tpl_desc",
      bulletKeys: [
        { textKey: "gs_ticket_tpl_b1", icon: <FileText className="w-3.5 h-3.5" /> },
        { textKey: "gs_ticket_tpl_b2", icon: <CirclePlus className="w-3.5 h-3.5" /> },
        { textKey: "gs_ticket_tpl_b3", icon: <Zap className="w-3.5 h-3.5" /> },
      ],
      durationKey: "gs_ticket_tpl_duration",
      ctaKey: "gs_ticket_tpl_cta",
      href: "/ticket?tab=template&action=create",
    },
    {
      id: "ticket-first",
      isModuleStep: true,
      moduleGroupKey: "mg_ticketing",
      icon: <Ticket className="w-5 h-5" />,
      titleKey: "gs_ticket_first_title",
      descKey: "gs_ticket_first_desc",
      bulletKeys: [
        { textKey: "gs_ticket_first_b1", icon: <FileText className="w-3.5 h-3.5" /> },
        { textKey: "gs_ticket_first_b2", icon: <Type className="w-3.5 h-3.5" /> },
        { textKey: "gs_ticket_first_b3", icon: <Send className="w-3.5 h-3.5" /> },
      ],
      durationKey: "gs_ticket_first_duration",
      ctaKey: "gs_ticket_first_cta",
      href: "/ticket?action=create",
    },
  ],
  campaign: [
    {
      id: "campaign-tpl",
      isModuleStep: true,
      moduleGroupKey: "mg_campaign_broadcast",
      icon: <Megaphone className="w-5 h-5" />,
      titleKey: "gs_campaign_tpl_title",
      descKey: "gs_campaign_tpl_desc",
      bulletKeys: [
        { textKey: "gs_campaign_tpl_b1", icon: <Type className="w-3.5 h-3.5" /> },
        { textKey: "gs_campaign_tpl_b2", icon: <MessageSquare className="w-3.5 h-3.5" /> },
        { textKey: "gs_campaign_tpl_b3", icon: <Send className="w-3.5 h-3.5" /> },
      ],
      durationKey: "gs_campaign_tpl_duration",
      ctaKey: "gs_campaign_tpl_cta",
      href: "/campaign",
    },
  ],
}

function buildSteps(t: (key: string) => string, selectedModules: string[]): Step[] {
  const moduleSteps = (["oms", "rms", "ticket", "campaign"] as const)
    .filter((m) => selectedModules.includes(m))
    .flatMap((m) => (MODULE_STEPS_DATA[m] || []).map((s) => ({ ...s, menuKey: null })))
  return [...CORE_STEPS, ...moduleSteps].map((def, i) => ({
    id: def.id,
    menuKey: def.menuKey ?? null,
    isModuleStep: def.isModuleStep,
    moduleGroup: def.moduleGroupKey ? t(def.moduleGroupKey) : undefined,
    moduleGroupKey: def.moduleGroupKey,
    icon: def.icon,
    label: `${t("step_label")} ${String(i + 1).padStart(2, "0")}`,
    title: t(def.titleKey),
    description: t(def.descKey),
    bullets: def.bulletKeys.map((b) => ({ text: t(b.textKey), icon: b.icon })),
    duration: t(def.durationKey),
    cta: t(def.ctaKey),
    href: def.href,
  }))
}

export default function GetStartedClient({ menus }: IProps) {
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false)
  const [isDiscoveryDone, setIsDiscoveryDone] = useState(false)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [completedLocalSteps, setCompletedLocalSteps] = useState<Set<string>>(new Set())
  const [skippedSteps, setSkippedSteps] = useState<Set<string>>(new Set())
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // resetOnboarding() (store sidebar mimin) tidak diporting: demo ini tidak punya store itu.
    const safeParse = <T,>(key: string, fallback: T): T => {
      try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T) : fallback
      } catch {
        return fallback
      }
    }
    // Sama seperti aslinya: localStorage baru dibaca setelah mount (hindari hydration mismatch)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDiscoveryDone(!!localStorage.getItem(DISCOVERY_STORAGE_KEY))
    setSelectedModules(safeParse<string[]>(MODULES_STORAGE_KEY, []))
    setCompletedLocalSteps(new Set(safeParse<string[]>(COMPLETED_STEPS_KEY, [])))
    setSkippedSteps(new Set(safeParse<string[]>(SKIPPED_STEPS_KEY, [])))
    setIsReady(true)
  }, [])

  const handleMarkCompleted = (stepId: string) => {
    const updated = new Set([...completedLocalSteps, stepId])
    setCompletedLocalSteps(updated)
    localStorage.setItem(COMPLETED_STEPS_KEY, JSON.stringify([...updated]))
  }

  const handleDiscoveryComplete = (modules: string[]) => {
    localStorage.setItem(DISCOVERY_STORAGE_KEY, "1")
    localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules))
    setIsDiscoveryDone(true)
    setSelectedModules(modules)
    setIsDiscoveryOpen(false)
  }

  const handleSkipStep = (stepId: string) => {
    const updated = new Set([...skippedSteps, stepId])
    setSkippedSteps(updated)
    localStorage.setItem(SKIPPED_STEPS_KEY, JSON.stringify([...updated]))
  }

  const STEPS = buildSteps(t, selectedModules)

  const isActuallyCompleted = (step: Step): boolean => {
    if (step.id === "discovery") return isDiscoveryDone
    if (step.isModuleStep) return completedLocalSteps.has(step.id)
    if (!step.menuKey) return false
    return menus.find((m) => m.nama_menu === step.menuKey)?.is_completed ?? false
  }

  const getStepCompleted = (step: Step): boolean => {
    return skippedSteps.has(step.id) || isActuallyCompleted(step)
  }

  const stepStatuses = STEPS.map((step) => getStepCompleted(step))
  const completedCount = stepStatuses.filter(Boolean).length
  const progressPct = Math.round((completedCount / STEPS.length) * 100)
  const activeIdx = stepStatuses.findIndex((done) => !done)

  const handleCTA = (step: Step) => {
    if (step.id === "discovery") {
      setIsDiscoveryOpen(true)
      return
    }
    // Versi demo: halaman tujuan (step.href) belum ada, jadi beri tahu alih-alih router.push
    toast.info(DEMO_PAGE_UNAVAILABLE)
  }

  const hasCoreSteps = CORE_STEPS.length

  return (
    <PanelContainer className="mx-auto max-w-4xl space-y-3">
      {isDiscoveryOpen && (
        <DiscoveryModal
          onComplete={handleDiscoveryComplete}
          onClose={() => setIsDiscoveryOpen(false)}
        />
      )}

      {/* Hero */}
      <OnboardingHero
        headingAs="h1"
        eyebrow={
          <>
            <Rocket />
            <p className="text-[11px] font-semibold uppercase tracking-wider">{t("welcome_to_mimin")}</p>
          </>
        }
        title={t("get_started_hero_title", { count: hasCoreSteps })}
        description={t("get_started_hero_desc")}
        aside={
          <>
            <Clock />
            <span>{t("get_started_total_duration")}</span>
          </>
        }
        loading={!isReady}
        progress={{ pct: progressPct, text: `${completedCount}/${STEPS.length} · ${progressPct}%` }}
      />

      {/* Steps timeline */}
      {!isReady ? (
        <div className="space-y-3" aria-hidden>
          {Array.from({ length: hasCoreSteps }).map((_, i) => (
            <SurfaceCard key={i} interactive={false} className="gap-2 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <Bone className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Bone className="h-3.5 w-1/3" />
                  <Bone className="h-3 w-2/3" />
                </div>
              </div>
              <Bone className="h-8 w-28 rounded-full" />
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <div className="relative flex flex-col pt-1">
          {STEPS.map((step, i) => {
            const isReallyDone = isActuallyCompleted(step)
            const isSkipped = skippedSteps.has(step.id) && !isReallyDone
            const isActive = i === activeIdx
            const isLast = i === STEPS.length - 1
            const showModuleGroupHeader =
              step.isModuleStep &&
              (i === 0 || STEPS[i - 1]?.moduleGroup !== step.moduleGroup)

            return (
              <div key={step.id}>
                {/* Module group header */}
                {showModuleGroupHeader && (
                  <div className="mb-3 mt-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/60" />
                    <div className={cn(SURFACE_PILL, "flex items-center gap-1.5 px-3 py-1")}>
                      {step.moduleGroupKey === "mg_order_management" && <Package className="size-3.5 text-muted-foreground" />}
                      {step.moduleGroupKey === "mg_reservation_booking" && <CalendarDays className="size-3.5 text-muted-foreground" />}
                      {step.moduleGroupKey === "mg_ticketing" && <Ticket className="size-3.5 text-muted-foreground" />}
                      {step.moduleGroupKey === "mg_campaign_broadcast" && <Megaphone className="size-3.5 text-muted-foreground" />}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {step.moduleGroup}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                )}

                <div className="relative flex gap-3 pb-3">
                  {!isLast && (
                    <div
                      className={cn(
                        "absolute bottom-0 left-3 top-6 z-0 w-0.5 -translate-x-1/2",
                        isReallyDone ? "bg-primary" : "bg-input"
                      )}
                    />
                  )}

                  {/* Step indicator */}
                  <div
                    className={cn(
                      "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors motion-reduce:transition-none",
                      isReallyDone
                        ? "border-primary bg-primary text-primary-foreground"
                        : isSkipped
                          ? "border-dashed border-input bg-white text-muted-foreground"
                          : isActive
                            ? "border-primary bg-white text-primary ring-4 ring-primary/15"
                            : cn("bg-white text-muted-foreground", step.isModuleStep ? "border-dashed border-input" : "border-input")
                    )}
                  >
                    {isReallyDone ? <Check className="size-3.5" strokeWidth={2.5} /> : i + 1}
                  </div>

                  {/* Card */}
                  <SurfaceCard
                    interactive={false}
                    selected={isActive && !isSkipped}
                    className={cn("min-w-0 flex-1 gap-2.5 p-3 sm:p-4", isSkipped && "opacity-70")}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
                          isActive && !isSkipped ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {step.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-medium text-muted-foreground">
                          <span>{step.label}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {step.duration}
                          </span>
                        </div>
                        <h3 className="text-balance text-sm font-semibold text-foreground">{step.title}</h3>
                        <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                      {isReallyDone && (
                        <Badge variant="outline" className={cn(BADGE_BASE, "shrink-0 gap-1 border-primary/20 bg-primary/10 text-primary")}>
                          <Check className="size-3" strokeWidth={2.5} />
                          {t("step_completed")}
                        </Badge>
                      )}
                      {isSkipped && (
                        <Badge variant="muted" className={cn(BADGE_BASE, "shrink-0")}>
                          {t("skipped")}
                        </Badge>
                      )}
                    </div>

                    {/* Bullets: hanya langkah aktif (bukan yang dilewati) */}
                    {isActive && !isSkipped && (
                      <div className="flex flex-wrap gap-1.5">
                        {step.bullets.map((b, bi) => (
                          <div
                            key={bi}
                            className="flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] text-muted-foreground"
                          >
                            <span className="shrink-0 text-primary [&_svg]:size-3">{b.icon}</span>
                            {b.text}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA row: semua langkah kecuali yang selesai */}
                    {!isReallyDone && (
                      <div className="flex flex-wrap items-center gap-2">
                        {isSkipped ? (
                          <Button size="sm" className={flatButton("default", "sm")} onClick={() => handleCTA(step)}>
                            {step.cta}
                            <ArrowRight className="size-3.5" />
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" className={flatButton("default", "sm")} onClick={() => handleCTA(step)}>
                              {step.cta}
                              <ArrowRight className="size-3.5" />
                            </Button>
                            {step.isModuleStep && (
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  flatButton("outline", "sm"),
                                  "border-emerald-600/50 text-emerald-700 hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                                )}
                                onClick={() => handleMarkCompleted(step.id)}
                              >
                                <Check className="size-3.5" strokeWidth={2.5} />
                                {t("mark_as_completed")}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(flatButton("ghost", "sm"), "text-muted-foreground")}
                              onClick={() => handleSkipStep(step.id)}
                            >
                              {t("skip_this_step")}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </SurfaceCard>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PanelContainer>
  )
}
