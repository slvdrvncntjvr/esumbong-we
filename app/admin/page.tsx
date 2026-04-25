"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, Calendar, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { TabletFrame } from "@/components/tablet-frame"
import { Button } from "@/components/ui/button"
import { useCaseStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { computeDaysRemaining, computeUrgency, DISPUTE_LABELS } from "@/lib/types"
import { COMPLEXITY_LABELS, COMPLEXITY_COLORS } from "@/lib/gemini"
import { sendAndLog, buildHearingReminderSms } from "@/lib/sms"
import { cn } from "@/lib/utils"
import type { Case } from "@/lib/types"

export default function AdminDashboardPage() {
  const { cases, smsLog, addHearing, addSmsLog, resetToSeed } = useCaseStore()
  const { user, login, isLoggedIn } = useAuth()
  const [search, setSearch] = useState("")
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null)
  const [schedDate, setSchedDate] = useState("")
  const [schedTime, setSchedTime] = useState("10:00 AM")

  const isAdmin = user?.role === "secretary" || user?.role === "captain"

  const activeCases = cases.filter((c) => c.status !== "settled" && c.status !== "cfa_approved" && c.status !== "dismissed")
  const hearingsToday = activeCases.filter((c) => {
    const today = new Date().toISOString().split("T")[0]
    return c.hearings.some((h) => h.date === today && h.result === "pending")
  })
  const cfaPending = activeCases.filter((c) => c.noShowCount >= 3 || c.status === "cfa_pending")

  // Search filter
  const filtered = activeCases.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.id.toLowerCase().includes(q) ||
      c.complainant.name.toLowerCase().includes(q) ||
      c.respondent.name.toLowerCase().includes(q) ||
      DISPUTE_LABELS[c.nature].toLowerCase().includes(q)
  }).sort((a, b) => computeDaysRemaining(a.deadlineDate) - computeDaysRemaining(b.deadlineDate))

  const metrics = [
    { label: "Active na Kaso", value: String(activeCases.length) },
    { label: "Hearing ngayon", value: String(hearingsToday.length) },
    { label: "Pending CFA", value: String(cfaPending.length) },
    { label: "SMS ipinadala", value: String(smsLog.length) },
  ]

  const handleSchedule = async (caseId: string) => {
    if (!schedDate) { toast.error("Pumili ng petsa"); return }

    const selectedDate = new Date(`${schedDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      toast.error("Hindi puwedeng mag-schedule sa nakaraang petsa")
      return
    }

    const c = cases.find((x) => x.id === caseId)
    if (!c) return

    if (c.hearings.some((h) => h.result === "pending")) {
      toast.error("May nakabukas nang hearing schedule para sa kasong ito")
      return
    }

    addHearing(caseId, {
      date: schedDate,
      time: schedTime,
      complainantAttended: null,
      respondentAttended: null,
      result: "pending",
    })

    // Send SMS reminders
    const smsContent = buildHearingReminderSms(caseId, schedDate, schedTime)
    const r1 = await sendAndLog(c.complainant.phone, smsContent)
    addSmsLog(r1)

    if (/^\+63\d{10}$/.test(c.respondent.phone)) {
      const r2 = await sendAndLog(c.respondent.phone, smsContent)
      addSmsLog(r2)
    }

    toast.success(`Hearing na-schedule para sa ${schedDate}`, {
      description: "SMS paalala ipinadala sa dalawang partido.",
    })
    setSchedulingFor(null)
    setSchedDate("")
  }

  if (!isLoggedIn || !isAdmin) {
    return (
      <TabletFrame>
        <div className="flex flex-col flex-1 items-center justify-center px-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Ang page na ito ay para sa Barangay Secretary o Captain demo account.
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={() => login("secretary")}>Login as Secretary</Button>
            <Button variant="outline" onClick={() => login("captain")}>Login as Captain</Button>
          </div>
        </div>
      </TabletFrame>
    )
  }

  return (
    <TabletFrame>
      <div className="flex flex-col flex-1">
        <header className="px-8 pt-8 pb-6 flex items-center justify-between gap-6 border-b border-border">
          <div className="space-y-1">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Barangay 459 · Admin</p>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Sec. {user?.name ?? "Maria Santos"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { resetToSeed(); toast.info("Data na-reset sa demo seed.") }} className="size-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Reset demo data" aria-label="Reset demo data">
              <RotateCcw className="size-4" />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-muted rounded-xl px-3 h-10">
              <Search className="size-4 text-muted-foreground" />
              <input className="bg-transparent text-sm outline-none w-56 placeholder:text-muted-foreground" placeholder="Hanapin ang kaso o partido" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[14px] font-semibold">
              MS
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-6 space-y-7 overflow-y-auto">
          {/* Metrics */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-[12px] text-muted-foreground">{m.label}</p>
                <p className="text-[28px] font-semibold tracking-tight text-foreground mt-1">{m.value}</p>
              </div>
            ))}
          </section>

          {/* Cases list */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold text-foreground">Mga kaso na kailangan ng pansin</h2>
              <span className="text-[13px] text-muted-foreground">{filtered.length} kaso</span>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {filtered.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground">Walang nakitang kaso.</div>
              ) : filtered.map((c) => (
                <CaseRow key={c.id} c={c}
                  isScheduling={schedulingFor === c.id}
                  onScheduleClick={() => setSchedulingFor(schedulingFor === c.id ? null : c.id)}
                  schedDate={schedDate}
                  schedTime={schedTime}
                  onDateChange={setSchedDate}
                  onTimeChange={setSchedTime}
                  onConfirmSchedule={() => handleSchedule(c.id)}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </TabletFrame>
  )
}

function CaseRow({ c, isScheduling, onScheduleClick, schedDate, schedTime, onDateChange, onTimeChange, onConfirmSchedule }: {
  c: Case
  isScheduling: boolean
  onScheduleClick: () => void
  schedDate: string
  schedTime: string
  onDateChange: (v: string) => void
  onTimeChange: (v: string) => void
  onConfirmSchedule: () => void
}) {
  const days = computeDaysRemaining(c.deadlineDate)
  const urgency = computeUrgency(days)
  const pendingHearing = c.hearings.find((h) => h.result === "pending")
  const hasPending = !!pendingHearing

  const urgencyLabel = urgency === "critical" ? "Kritikal" : urgency === "warning" ? "Pansin" : "Maayos"
  const urgencyStyle = urgency === "critical" ? "bg-destructive/12 text-destructive ring-destructive/25"
    : urgency === "warning" ? "bg-warning/15 text-warning-foreground ring-warning/30"
    : "bg-success/15 text-success ring-success/30"

  const actionLabel = c.noShowCount >= 3 ? "Generate Draft CFA" : hasPending ? "Record Outcome" : "Schedule Hearing"
  const actionHref = c.noShowCount >= 3 ? `/admin/cfa/${c.id}` : hasPending ? `/admin/record/${c.id}` : "#"

  return (
    <div className="px-5 py-4 hover:bg-muted/40 transition-colors space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">#{c.id}</span>
            <span className="text-[14px] font-medium text-foreground">{DISPUTE_LABELS[c.nature]}</span>
            {c.aiAnalysis && (
              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1", COMPLEXITY_COLORS[c.aiAnalysis.complexity])}>
                AI: {COMPLEXITY_LABELS[c.aiAnalysis.complexity]}
              </span>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground truncate">{c.complainant.name} vs. {c.respondent.name}</p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", urgencyStyle)}>
              {urgencyLabel} · {days} araw
            </span>
            {c.noShowCount > 0 && (
              <span className="text-[11px] text-destructive font-medium">
                {c.noShowCount}x hindi dumalo
              </span>
            )}
          </div>
        </div>
        {actionHref !== "#" ? (
          <Link href={actionHref} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 h-9 text-[13px] font-medium hover:opacity-90 transition-opacity">
            {actionLabel} <ChevronRight className="size-3.5" strokeWidth={2.25} />
          </Link>
        ) : (
          <button onClick={onScheduleClick} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 h-9 text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Calendar className="size-3.5" /> Schedule
          </button>
        )}
      </div>

      {/* Inline scheduler */}
      {isScheduling && (
        <div className="flex items-end gap-3 pt-1 pb-1 pl-4 border-l-2 border-primary/30">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Petsa</label>
            <input type="date" className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={schedDate} onChange={(e) => onDateChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Oras</label>
            <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={schedTime} onChange={(e) => onTimeChange(e.target.value)}>
              <option>8:00 AM</option>
              <option>9:00 AM</option>
              <option>10:00 AM</option>
              <option>1:00 PM</option>
              <option>2:00 PM</option>
              <option>3:00 PM</option>
            </select>
          </div>
          <Button size="sm" onClick={onConfirmSchedule} className="h-9">Ipadala SMS</Button>
        </div>
      )}
    </div>
  )
}
