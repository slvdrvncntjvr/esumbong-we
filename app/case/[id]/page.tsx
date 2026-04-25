"use client"

import { useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Calendar, MapPin, User, Check, AlertTriangle } from "lucide-react"
import { PhoneFrame } from "@/components/phone-frame"
import { BottomNav } from "@/components/bottom-nav"
import { useCaseStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { computeDaysRemaining, computeUrgency, DISPUTE_LABELS } from "@/lib/types"
import { COMPLEXITY_LABELS, COMPLEXITY_COLORS } from "@/lib/gemini"
import { cn } from "@/lib/utils"

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { getCaseById } = useCaseStore()
  const { user, isLoggedIn } = useAuth()
  const router = useRouter()
  const c = getCaseById(id)

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login")
  }, [isLoggedIn, router])

  if (!c) {
    return (
      <PhoneFrame>
        <div className="flex flex-col flex-1 items-center justify-center px-6">
          <p className="text-muted-foreground">Case not found.</p>
          <Link href="/dashboard" className="text-primary text-sm mt-2 underline underline-offset-4">Back to dashboard</Link>
        </div>
      </PhoneFrame>
    )
  }

  const citizenCannotAccess = user?.role === "citizen" && c.complainant.phone !== user.phone
  if (citizenCannotAccess) {
    return (
      <PhoneFrame>
        <div className="flex flex-col flex-1 items-center justify-center px-6">
          <p className="text-muted-foreground text-center">Wala kang access sa kasong ito.</p>
          <Link href="/cases" className="text-primary text-sm mt-2 underline underline-offset-4">Bumalik sa listahan</Link>
        </div>
      </PhoneFrame>
    )
  }

  const days = computeDaysRemaining(c.deadlineDate)
  const urgency = computeUrgency(days)
  const completedHearings = c.hearings.filter((h) => h.result !== "pending")
  const pendingHearing = c.hearings.find((h) => h.result === "pending")

  const statusLabel = c.status === "settled" ? "Naayos na"
    : c.status === "cfa_approved" ? "CFA Approved"
    : c.status === "hearing_scheduled" ? "Hearing Scheduled"
    : c.status === "filed" ? "Na-file"
    : c.status === "cfa_pending" ? "CFA Pending"
    : c.status === "mediation" ? "Mediation"
    : c.status

  const statusColor = c.status === "settled" || c.status === "cfa_approved"
    ? "bg-success/15 text-success ring-success/30"
    : urgency === "critical" ? "bg-destructive/12 text-destructive ring-destructive/25"
    : urgency === "warning" ? "bg-warning/15 text-warning-foreground ring-warning/30"
    : "bg-muted text-muted-foreground ring-border"

  return (
    <PhoneFrame>
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 h-14 flex items-center gap-2">
            <Link href="/dashboard" className="size-9 -ml-2 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Back">
              <ChevronLeft className="size-5" strokeWidth={2} />
            </Link>
            <h1 className="text-[15px] font-semibold text-foreground">Case Details</h1>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 pb-24 space-y-6 overflow-y-auto">
          <div className="space-y-2">
            <p className="text-[12px] font-mono text-muted-foreground">Case #{c.id}</p>
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground leading-tight">
              {DISPUTE_LABELS[c.nature]} <span className="text-muted-foreground font-normal">vs.</span> {c.respondent.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", statusColor)}>
                {statusLabel}
              </span>
              {c.aiAnalysis && (
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", COMPLEXITY_COLORS[c.aiAnalysis.complexity])}>
                  AI: {COMPLEXITY_LABELS[c.aiAnalysis.complexity]}
                </span>
              )}
            </div>
          </div>

          {/* Jurisdiction warning */}
          {c.aiAnalysis?.jurisdictionFlag && (
            <div className="rounded-2xl bg-destructive/8 border border-destructive/25 p-4 flex items-start gap-3">
              <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" strokeWidth={2.25} />
              <p className="text-[13px] leading-relaxed text-foreground">{c.aiAnalysis.jurisdictionNote}</p>
            </div>
          )}

          {/* Days remaining */}
          {c.status !== "settled" && c.status !== "cfa_approved" && (
            <div className={cn("rounded-2xl border p-4 flex items-center justify-between",
              urgency === "critical" ? "bg-destructive/5 border-destructive/20" :
              urgency === "warning" ? "bg-warning/5 border-warning/20" :
              "bg-muted/40 border-border"
            )}>
              <span className="text-[13px] text-foreground font-medium">60-day limit</span>
              <span className={cn("text-[15px] font-bold",
                urgency === "critical" ? "text-destructive" : urgency === "warning" ? "text-warning-foreground" : "text-foreground"
              )}>
                {days} araw na natitira
              </span>
            </div>
          )}

          {/* Next hearing */}
          {pendingHearing && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Susunod na Hearing</h3>
              <div className="space-y-2.5">
                <Row icon={<Calendar className="size-4" />} text={`${new Date(pendingHearing.date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })} — ${pendingHearing.time}`} />
                <Row icon={<MapPin className="size-4" />} text={c.barangay + " Hall"} />
                <Row icon={<User className="size-4" />} text="Punong Barangay presiding" />
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Timeline</h3>
            <ol className="space-y-4">
              <Step done label="Reklamo na-file" detail={new Date(c.filedDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} />
              {completedHearings.map((h, i) => (
                <Step key={h.id} done
                  label={`Hearing ${i + 1} — ${h.result === "settled" ? "Naayos" : h.result === "failed" ? "Hindi naayos" : "Nai-reschedule"}`}
                  detail={`${new Date(h.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}${h.respondentAttended === false ? " · Hindi dumalo ang respondent" : ""}`}
                />
              ))}
              {pendingHearing && (
                <Step upcoming label={`Hearing ${completedHearings.length + 1}`} detail={`${new Date(pendingHearing.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} · Nakabiskedyul`} />
              )}
              {c.status !== "settled" && c.status !== "cfa_approved" && (
                <Step muted label="Settlement o CFA" detail="Sa loob ng 60-day limit" />
              )}
              {c.cfaApproved && (
                <Step done label="CFA Approved" detail={c.cfaApprovedDate ? new Date(c.cfaApprovedDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "Approved"} />
              )}
            </ol>
          </div>

          {/* Brief */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <h3 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Salaysay</h3>
            <p className="text-[14px] leading-relaxed text-foreground text-pretty">{c.description}</p>
          </div>

          {/* No-show count */}
          {c.noShowCount > 0 && (
            <div className="rounded-2xl bg-warning/10 border border-warning/20 p-4">
              <p className="text-[13px] text-foreground">
                <span className="font-medium">Hindi dumalo ang respondent:</span> {c.noShowCount}x
                {c.noShowCount >= 3 && " — Maaari nang mag-issue ng CFA."}
              </p>
            </div>
          )}
        </main>
        <BottomNav />
      </div>
    </PhoneFrame>
  )
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[14px] text-foreground">
      <span className="text-muted-foreground">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function Step({ label, detail, done, upcoming, muted }: { label: string; detail: string; done?: boolean; upcoming?: boolean; muted?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className={
        done ? "size-5 rounded-full bg-success text-success-foreground flex items-center justify-center mt-0.5"
        : upcoming ? "size-5 rounded-full bg-primary/15 text-primary flex items-center justify-center mt-0.5 ring-2 ring-primary/20"
        : "size-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center mt-0.5"
      }>
        {done ? <Check className="size-3" strokeWidth={3} /> : <span className={upcoming ? "size-1.5 rounded-full bg-primary" : "size-1.5 rounded-full bg-muted-foreground/40"} />}
      </span>
      <div className="flex-1 -mt-px">
        <p className={muted ? "text-[14px] text-muted-foreground" : "text-[14px] font-medium text-foreground"}>{label}</p>
        <p className="text-[12px] text-muted-foreground">{detail}</p>
      </div>
    </li>
  )
}
