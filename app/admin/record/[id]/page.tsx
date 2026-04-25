"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Check, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhoneFrame } from "@/components/phone-frame"
import { useCaseStore } from "@/lib/store"
import { DISPUTE_LABELS } from "@/lib/types"
import { sendAndLog, buildHearingResultSms, buildNoShowWarningSms } from "@/lib/sms"
import { cn } from "@/lib/utils"

type Attendance = "appeared" | "absent" | null

export default function RecordOutcomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { getCaseById, recordHearingOutcome, addSmsLog } = useCaseStore()
  const c = getCaseById(id)

  const [complainant, setComplainant] = useState<Attendance>("appeared")
  const [respondent, setRespondent] = useState<Attendance>(null)
  const [result, setResult] = useState<string>("")
  const [saving, setSaving] = useState(false)

  if (!c) {
    return (
      <PhoneFrame>
        <div className="flex flex-col flex-1 items-center justify-center">
          <p className="text-muted-foreground">Case not found.</p>
          <Link href="/admin" className="text-primary text-sm mt-2 underline">Back</Link>
        </div>
      </PhoneFrame>
    )
  }

  const pendingHearing = c.hearings.find((h) => h.result === "pending")
  if (!pendingHearing) {
    return (
      <PhoneFrame>
        <div className="flex flex-col flex-1 items-center justify-center px-6">
          <p className="text-muted-foreground">Walang pending hearing para sa kasong ito.</p>
          <Link href="/admin" className="text-primary text-sm mt-2 underline">Back</Link>
        </div>
      </PhoneFrame>
    )
  }

  const handleSave = async () => {
    if (!respondent) { toast.error("I-record kung dumalo ang respondent"); return }
    if (!result) { toast.error("Pumili ng resulta"); return }

    setSaving(true)
    try {
      recordHearingOutcome(c.id, pendingHearing.id, {
        complainantAttended: complainant === "appeared",
        respondentAttended: respondent === "appeared",
        result: result as "settled" | "rescheduled" | "failed",
      })

      // Send SMS about result
      const resultLabel = result === "settled" ? "Naayos" : result === "failed" ? "Hindi naayos" : "Nai-reschedule"
      const sms1 = await sendAndLog(c.complainant.phone, buildHearingResultSms(c.id, resultLabel))
      addSmsLog(sms1)

      // No-show warning
      if (respondent === "absent") {
        const newCount = c.noShowCount + 1
        if (newCount >= 3) {
          toast.warning(`Respondent hindi dumalo ${newCount}x. Maaari nang mag-issue ng CFA.`, { duration: 6000 })
        }
        const sms2 = await sendAndLog(c.complainant.phone, buildNoShowWarningSms(c.id, newCount))
        addSmsLog(sms2)
      }

      toast.success("Outcome na-record na!")
      router.push("/admin")
    } catch (err) {
      toast.error("May error. Pakisubukan muli.")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PhoneFrame>
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 h-14 flex items-center gap-2">
            <Link href="/admin" className="size-9 -ml-2 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Back">
              <ChevronLeft className="size-5" strokeWidth={2} />
            </Link>
            <div className="leading-tight">
              <h1 className="text-[15px] font-semibold text-foreground">I-record ang Resulta</h1>
              <p className="text-[11px] text-muted-foreground font-mono">Case #{c.id}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 pb-32 space-y-6">
          <div className="rounded-2xl bg-accent/60 border border-accent px-4 py-3">
            <p className="text-[13px] text-accent-foreground">
              <span className="font-medium">Hearing</span> · {new Date(pendingHearing.date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })} · {pendingHearing.time}
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Nagrereklamo</h2>
            <p className="text-[15px] font-medium text-foreground -mt-1">{c.complainant.name}</p>
            <AttendanceToggle value={complainant} onChange={setComplainant} />
          </section>

          <div className="h-px bg-border" />

          <section className="space-y-3">
            <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Respondent</h2>
            <p className="text-[15px] font-medium text-foreground -mt-1">{c.respondent.name}</p>
            <AttendanceToggle value={respondent} onChange={setRespondent} />
          </section>

          <div className="h-px bg-border" />

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="result">Resulta</FieldLabel>
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger id="result" className="h-12">
                  <SelectValue placeholder="Pumili ng resulta ng hearing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="settled">Naayos (Settled)</SelectItem>
                  <SelectItem value="rescheduled">I-reschedule</SelectItem>
                  <SelectItem value="failed">Hindi naayos (Failed)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </main>

        <footer className="sticky bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur">
          <div className="px-6 py-4">
            <Button size="lg" className="w-full h-12 text-[15px] font-medium" onClick={handleSave} disabled={saving}>
              {saving ? "Sine-save..." : "I-save ang Record"}
            </Button>
          </div>
        </footer>
      </div>
    </PhoneFrame>
  )
}

function AttendanceToggle({ value, onChange }: { value: Attendance; onChange: (v: Attendance) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={() => onChange("appeared")} className={cn(
        "h-16 rounded-2xl border text-[14px] font-medium flex items-center justify-center gap-2 transition-all",
        value === "appeared" ? "bg-success text-success-foreground border-success shadow-sm" : "bg-card text-foreground border-border hover:border-success/40 hover:bg-success/5"
      )} aria-pressed={value === "appeared"}>
        <Check className="size-4" strokeWidth={2.5} /> Dumalo
      </button>
      <button type="button" onClick={() => onChange("absent")} className={cn(
        "h-16 rounded-2xl border text-[14px] font-medium flex items-center justify-center gap-2 transition-all",
        value === "absent" ? "bg-destructive text-destructive-foreground border-destructive shadow-sm" : "bg-card text-foreground border-border hover:border-destructive/40 hover:bg-destructive/5"
      )} aria-pressed={value === "absent"}>
        <X className="size-4" strokeWidth={2.5} /> Hindi Dumalo
      </button>
    </div>
  )
}
