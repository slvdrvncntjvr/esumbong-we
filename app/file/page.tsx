"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhoneFrame } from "@/components/phone-frame"
import { useCaseStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { categorizeDispute } from "@/lib/gemini"
import { sendAndLog, buildCaseFiledSms } from "@/lib/sms"
import { formatPhone } from "@/lib/types"
import type { DisputeNature } from "@/lib/types"

export default function FileComplaintPage() {
  const router = useRouter()
  const { createCase, updateCase, addSmsLog } = useCaseStore()
  const { user } = useAuth()

  const [respondentName, setRespondentName] = useState("")
  const [respondentPhone, setRespondentPhone] = useState("")
  const [nature, setNature] = useState<DisputeNature | "">("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!respondentName.trim()) { toast.error("Pakilagay ang pangalan ng respondent"); return }
    if (!nature) { toast.error("Pumili ng uri ng reklamo"); return }
    if (!description.trim()) { toast.error("Pakilagay ang maikling paglalarawan"); return }

    setSubmitting(true)
    try {
      // AI categorization
      const aiResult = categorizeDispute(description)

      // Create case
      const newCase = createCase({
        complainant: { name: user?.name ?? "Complainant", phone: user?.phone ?? "+639000000000" },
        respondent: { name: respondentName.trim(), phone: formatPhone(respondentPhone) },
        nature: nature as DisputeNature,
        description: description.trim(),
      })

      // Update with AI analysis
      updateCase(newCase.id, { aiAnalysis: aiResult })

      // Send SMS to complainant
      const smsContent = buildCaseFiledSms(newCase.id)
      const smsResult = await sendAndLog(newCase.complainant.phone, smsContent)
      addSmsLog(smsResult)

      // If respondent phone provided, notify them too
      if (respondentPhone.trim()) {
        const respSms = await sendAndLog(
          formatPhone(respondentPhone),
          `[eSumbong] May reklamo laban sa inyo (Ref: ${newCase.id}). Pumunta sa Brgy Hall para sa impormasyon.`
        )
        addSmsLog(respSms)
      }

      // Show jurisdiction warning if flagged
      if (aiResult.jurisdictionFlag) {
        toast.warning("Babala: Ang kasong ito ay maaaring kriminal", {
          description: aiResult.jurisdictionNote,
          duration: 8000,
        })
      }

      toast.success(`Reklamo #${newCase.id} na-file na!`, {
        description: `SMS ipinadala sa ${newCase.complainant.phone}`,
      })

      router.push(`/case/${newCase.id}`)
    } catch (err) {
      toast.error("May error. Pakisubukan muli.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PhoneFrame>
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
          <div className="px-4 h-14 flex items-center gap-2">
            <Link href="/dashboard" className="size-9 -ml-2 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Back">
              <ChevronLeft className="size-5" strokeWidth={2} />
            </Link>
            <div className="leading-tight">
              <h1 className="text-[15px] font-semibold text-foreground">Mag-file ng Reklamo</h1>
              <p className="text-[11px] text-muted-foreground">I-reklamo</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 pb-32 overflow-y-auto">
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="respondent">
                Pangalan ng Respondent <span className="text-destructive">*</span>
                <span className="ml-1 text-muted-foreground font-normal">— Sino ang inirereklamo?</span>
              </FieldLabel>
              <Input id="respondent" placeholder="Buong pangalan" className="h-11" value={respondentName} onChange={(e) => setRespondentName(e.target.value)} />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact">
                Numero ng Respondent <span className="ml-1 text-muted-foreground font-normal">— Opsyonal</span>
              </FieldLabel>
              <Input id="contact" type="tel" inputMode="tel" placeholder="+63 9XX XXX XXXX" className="h-11" value={respondentPhone} onChange={(e) => setRespondentPhone(e.target.value)} />
            </Field>

            <Field>
              <FieldLabel htmlFor="nature">Uri ng Reklamo <span className="text-destructive">*</span></FieldLabel>
              <Select value={nature} onValueChange={(v) => setNature(v as DisputeNature)}>
                <SelectTrigger id="nature" className="h-11">
                  <SelectValue placeholder="Pumili ng kategorya" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property_damage">Pinsala sa Ari-arian</SelectItem>
                  <SelectItem value="debt">Utang</SelectItem>
                  <SelectItem value="noise">Ingay / Abala</SelectItem>
                  <SelectItem value="boundary">Alitan sa Hangganan</SelectItem>
                  <SelectItem value="personal_injury">Pinsala sa Katawan</SelectItem>
                  <SelectItem value="other">Iba pa</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="description">
                Maikling Paglalarawan <span className="text-destructive">*</span>
              </FieldLabel>
              <Textarea
                id="description"
                rows={6}
                maxLength={500}
                placeholder="Ano ang nangyari? Kailan at saan ito naganap?"
                className="resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex justify-between">
                <FieldDescription>Manatili sa mga katotohanan. Maaari kang magdagdag ng ebidensya mamaya.</FieldDescription>
                <span className="text-[11px] text-muted-foreground">{description.length}/500</span>
              </div>
            </Field>
          </FieldGroup>
        </main>

        <footer className="sticky bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="px-6 py-4">
            <Button size="lg" className="w-full h-12 text-[15px] font-medium" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Isinusumite..." : "Isumite ang Reklamo"}
            </Button>
          </div>
        </footer>
      </div>
    </PhoneFrame>
  )
}
