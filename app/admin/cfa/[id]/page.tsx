"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, AlertTriangle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { PhoneFrame } from "@/components/phone-frame"
import { useCaseStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { DISPUTE_LABELS } from "@/lib/types"
import { sendAndLog, buildCfaReadySms } from "@/lib/sms"

export default function CfaApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoggedIn, login } = useAuth()
  const { getCaseById, approveCfa, addSmsLog } = useCaseStore()
  const c = getCaseById(id)
  const [approved, setApproved] = useState(false)
  const [approving, setApproving] = useState(false)

  const isAdmin = user?.role === "secretary" || user?.role === "captain"

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

  const handleApprove = async () => {
    setApproving(true)
    try {
      approveCfa(c.id)
      const sms = await sendAndLog(c.complainant.phone, buildCfaReadySms(c.id))
      addSmsLog(sms)
      setApproved(true)
      toast.success("CFA na-approve at na-sign na!", {
        description: `SMS ipinadala sa ${c.complainant.name}`,
      })
    } catch (err) {
      toast.error("May error. Pakisubukan muli.")
      console.error(err)
    } finally {
      setApproving(false)
    }
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })

  if (!isLoggedIn || !isAdmin) {
    return (
      <PhoneFrame>
        <div className="flex flex-col flex-1 items-center justify-center px-8 text-center space-y-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground">Kailangan ng barangay admin demo account para sa CFA approval.</p>
          <div className="flex items-center gap-3">
            <Button onClick={() => login("secretary")}>Login as Secretary</Button>
            <Button variant="outline" onClick={() => router.push("/login")}>Back to Login</Button>
          </div>
        </div>
      </PhoneFrame>
    )
  }

  if (approved) {
    return (
      <PhoneFrame>
        <div className="flex flex-col flex-1 items-center justify-center px-8 text-center space-y-4">
          <div className="size-16 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">CFA Na-approve</h2>
          <p className="text-sm text-muted-foreground">
            Certificate to File Action para sa Kaso #{c.id} ay na-sign at naipadala na sa nagrereklamo.
          </p>
          {/* Simple QR placeholder */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <div className="w-32 h-32 mx-auto bg-foreground/5 rounded-lg flex items-center justify-center border border-border">
              <div className="grid grid-cols-5 gap-[2px]">
                {Array.from({ length: 25 }).map((_, i) => {
                  const code = (c.id.charCodeAt(i % c.id.length) + i * 7) % 5
                  return (
                    <div key={i} className={`size-4 rounded-sm ${code >= 2 ? "bg-foreground" : "bg-transparent"}`} />
                  )
                })}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">esumbong.app/verify/{c.id}</p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/admin">Bumalik sa Dashboard</Link>
          </Button>
        </div>
      </PhoneFrame>
    )
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
              <h1 className="text-[15px] font-semibold text-foreground">Review Draft CFA</h1>
              <p className="text-[11px] text-muted-foreground font-mono">Case #{c.id}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-5 pb-32 bg-muted/40">
          <div className="rounded-2xl bg-destructive/8 border border-destructive/25 p-4 flex items-start gap-3 mb-5">
            <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" strokeWidth={2.25} />
            <p className="text-[13px] leading-relaxed text-foreground">
              Respondent hindi dumalo {c.noShowCount}x. <span className="font-medium">60-day limit malapit na.</span>
            </p>
          </div>

          <article className="rounded-md bg-card border border-border shadow-[0_8px_24px_-12px_rgb(15_23_42_/_0.12)] px-7 py-9 space-y-6">
            <div className="text-center space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Republic of the Philippines</p>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">City of Manila — {c.barangay}</p>
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground pt-2">Certificate to File Action</h2>
              <p className="text-[11px] font-mono text-muted-foreground pt-1">Case #{c.id}</p>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-4 text-[13px] leading-relaxed text-foreground text-pretty">
              <p>
                <span className="font-medium">This is to certify</span> that there has been a personal confrontation between the parties before the Punong Barangay, but mediation and conciliation efforts have failed.
              </p>
              <p>
                <span className="font-medium">Complainant:</span> {c.complainant.name}<br />
                <span className="font-medium">Respondent:</span> {c.respondent.name}<br />
                <span className="font-medium">Nature:</span> {DISPUTE_LABELS[c.nature]}
              </p>
              <p>
                The complainant is therefore allowed to file the corresponding action in court, in accordance with Section 412 of the Local Government Code of 1991.
              </p>
              <p className="pt-3 text-muted-foreground italic">
                Issued this {dateStr} at {c.barangay}.
              </p>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-1">
              <p className="text-[12px] text-muted-foreground">Punong Barangay</p>
              <p className="text-[14px] font-medium text-foreground">Hon. Reynaldo R. Reyes</p>
            </div>
          </article>
        </main>

        <footer className="sticky bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur">
          <div className="px-6 py-4 grid grid-cols-2 gap-3">
            <Button asChild variant="outline" size="lg" className="h-12 text-[14px] font-medium">
              <Link href="/admin">I-reject / I-edit</Link>
            </Button>
            <Button size="lg" className="h-12 text-[14px] font-medium" onClick={handleApprove} disabled={approving}>
              {approving ? "Sine-sign..." : "Sign & Approve"}
            </Button>
          </div>
        </footer>
      </div>
    </PhoneFrame>
  )
}
