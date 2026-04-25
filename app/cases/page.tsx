"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { PhoneFrame } from "@/components/phone-frame"
import { BottomNav } from "@/components/bottom-nav"
import { useCaseStore } from "@/lib/store"
import { computeDaysRemaining, computeUrgency, DISPUTE_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function CasesPage() {
  const { cases } = useCaseStore()

  const sorted = [...cases].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, warning: 1, normal: 2 }
    const ua = computeUrgency(computeDaysRemaining(a.deadlineDate))
    const ub = computeUrgency(computeDaysRemaining(b.deadlineDate))
    if (a.status === "settled" || a.status === "cfa_approved") return 1
    if (b.status === "settled" || b.status === "cfa_approved") return -1
    return (order[ua] ?? 2) - (order[ub] ?? 2)
  })

  return (
    <PhoneFrame>
      <div className="flex flex-col flex-1">
        <header className="px-6 pt-10 pb-4">
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Mga Kaso</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Lahat ng reklamo na inyong na-file.</p>
        </header>

        <main className="flex-1 px-6 pb-24 space-y-3 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Wala pang kaso.</p>
            </div>
          ) : sorted.map((c) => {
            const days = computeDaysRemaining(c.deadlineDate)
            const urgency = computeUrgency(days)
            const isActive = c.status !== "settled" && c.status !== "cfa_approved" && c.status !== "dismissed"
            const statusColor = !isActive ? "bg-success/15 text-success ring-success/30"
              : urgency === "critical" ? "bg-destructive/12 text-destructive ring-destructive/25"
              : urgency === "warning" ? "bg-warning/15 text-warning-foreground ring-warning/30"
              : "bg-muted text-muted-foreground ring-border"

            const statusLabel = c.status === "settled" ? "Naayos na"
              : c.status === "cfa_approved" ? "CFA Approved"
              : c.status === "hearing_scheduled" ? "Hearing"
              : c.status === "filed" ? "Na-file"
              : c.status === "cfa_pending" ? "CFA Pending"
              : c.status

            return (
              <Link key={c.id} href={`/case/${c.id}`} className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-[11px] font-mono text-muted-foreground">#{c.id}</p>
                    <p className="text-[14px] font-medium text-foreground leading-snug">
                      {DISPUTE_LABELS[c.nature]} <span className="text-muted-foreground font-normal">vs.</span> {c.respondent.name}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", statusColor)}>
                        {statusLabel}
                      </span>
                      {isActive && (
                        <span className={cn("text-[11px] font-medium", urgency === "critical" ? "text-destructive" : urgency === "warning" ? "text-warning-foreground" : "text-muted-foreground")}>
                          {days} araw na natitira
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground mt-1 shrink-0" strokeWidth={2} />
                </div>
              </Link>
            )
          })}
        </main>
        <BottomNav />
      </div>
    </PhoneFrame>
  )
}
