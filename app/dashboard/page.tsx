"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Plus, Check, Calendar, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PhoneFrame } from "@/components/phone-frame"
import { BottomNav } from "@/components/bottom-nav"
import { useCaseStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { computeDaysRemaining, computeUrgency, DISPUTE_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

export default function DashboardPage() {
  const { cases } = useCaseStore()
  const { user, isLoggedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login")
  }, [isLoggedIn, router])

  // For citizen: show their cases. For admin: show all.
  const role = user?.role ?? "citizen"
  const activeCases = cases.filter((c) => c.status !== "settled" && c.status !== "cfa_approved" && c.status !== "dismissed")
  const topCase = activeCases[0]
  const userName = user?.name?.split(" ")[0] ?? "User"

  return (
    <PhoneFrame>
      <div className="flex flex-col flex-1">
        <header className="px-6 pt-10 pb-4 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[13px] text-muted-foreground">Magandang araw,</p>
            <h1 className="text-[24px] leading-tight font-semibold tracking-tight text-foreground">{userName}</h1>
          </div>
          <Link href="/profile" className="size-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Notifications">
            <Bell className="size-[18px]" strokeWidth={1.75} />
          </Link>
        </header>

        <main className="flex-1 px-6 pb-28 space-y-6 overflow-y-auto">
          {topCase ? (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Active case</h2>
                <Link href="/cases" className="text-[13px] text-primary hover:underline underline-offset-4">View all</Link>
              </div>
              <CaseCard c={topCase} />
            </section>
          ) : (
            <section className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
              <p className="text-[15px] font-medium text-foreground">Walang aktibong kaso</p>
              <p className="text-[13px] text-muted-foreground">Mag-file ng reklamo kung kailangan ng tulong.</p>
            </section>
          )}

          <section className="rounded-2xl bg-accent/60 border border-accent p-4">
            <p className="text-[13px] leading-relaxed text-accent-foreground text-pretty">
              <span className="font-medium">Tip:</span> Dalhin ang valid ID at mga litrato o resibo na may kaugnayan sa inyong kaso sa hearing.
            </p>
          </section>

          {activeCases.length > 1 && (
            <section className="space-y-3">
              <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Iba pang kaso</h2>
              {activeCases.slice(1, 4).map((c) => (
                <Link key={c.id} href={`/case/${c.id}`} className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-mono text-muted-foreground">#{c.id}</p>
                      <p className="text-[13px] font-medium text-foreground">{DISPUTE_LABELS[c.nature]}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </section>
          )}
        </main>

        <Button asChild className="absolute right-5 bottom-24 size-14 rounded-full p-0 shadow-lg shadow-primary/30" aria-label="File new complaint">
          <Link href="/file"><Plus className="size-6" strokeWidth={2.25} /></Link>
        </Button>

        <BottomNav />
      </div>
    </PhoneFrame>
  )
}

function CaseCard({ c }: { c: import("@/lib/types").Case }) {
  const days = computeDaysRemaining(c.deadlineDate)
  const urgency = computeUrgency(days)
  const nextHearing = c.hearings.find((h) => h.result === "pending")
  const completedHearings = c.hearings.filter((h) => h.result !== "pending")

  const statusLabel = c.status === "hearing_scheduled" ? "Hearing Scheduled"
    : c.status === "mediation" ? "Mediation"
    : c.status === "cfa_pending" ? "CFA Pending"
    : c.status === "filed" ? "Filed"
    : c.status

  const statusColor = urgency === "critical" ? "bg-destructive/12 text-destructive ring-destructive/25"
    : urgency === "warning" ? "bg-warning/15 text-warning-foreground ring-warning/30"
    : "bg-success/15 text-success ring-success/30"

  return (
    <Link href={`/case/${c.id}`} className="block rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_rgb(30_58_138_/_0.18)] transition-all">
      <div className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[12px] font-mono text-muted-foreground">Case #{c.id}</p>
            <p className="text-[15px] font-medium text-foreground leading-snug">
              {DISPUTE_LABELS[c.nature]} <span className="text-muted-foreground">vs.</span> {c.respondent.name}
            </p>
          </div>
          <span className={cn("shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", statusColor)}>
            {statusLabel}
          </span>
        </div>

        <ol className="space-y-3">
          <TimelineItem state="done" label="Filed" detail={new Date(c.filedDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} />
          {completedHearings.slice(-1).map((h) => (
            <TimelineItem key={h.id} state="done" label={`Hearing — ${h.result}`} detail={new Date(h.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} />
          ))}
          {nextHearing && (
            <TimelineItem state="upcoming" label="Next Hearing" detail={`${new Date(nextHearing.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} — ${nextHearing.time}`} icon={<Calendar className="size-3" strokeWidth={2.25} />} />
          )}
        </ol>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[13px] font-medium text-primary">View full details</span>
          <ChevronRight className="size-4 text-primary" strokeWidth={2} />
        </div>
      </div>
    </Link>
  )
}

function TimelineItem({ state, label, detail, icon }: { state: "done" | "upcoming"; label: string; detail: string; icon?: React.ReactNode }) {
  const done = state === "done"
  return (
    <li className="flex items-start gap-3">
      <span className={done ? "size-5 rounded-full bg-success text-success-foreground flex items-center justify-center mt-0.5" : "size-5 rounded-full bg-primary/15 text-primary flex items-center justify-center mt-0.5 ring-2 ring-primary/20"}>
        {done ? <Check className="size-3" strokeWidth={3} /> : (icon ?? <span className="size-1.5 rounded-full bg-primary" />)}
      </span>
      <div className="flex-1 min-w-0 -mt-px">
        <p className={done ? "text-[14px] text-foreground" : "text-[14px] font-medium text-foreground"}>{label}</p>
        <p className="text-[12px] text-muted-foreground">{detail}</p>
      </div>
    </li>
  )
}
