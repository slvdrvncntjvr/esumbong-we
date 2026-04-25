"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Scale } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PhoneFrame } from "@/components/phone-frame"
import { useAuth } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [phone, setPhone] = useState("+63 917 555 0142")
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState("")
  const [sending, setSending] = useState(false)

  const handleSendOtp = () => {
    if (!phone.replace(/\s/g, "").match(/^\+?63\d{10}$/)) {
      toast.error("Pakilagay ang tamang numero ng telepono")
      return
    }
    setSending(true)
    // Simulate OTP send delay
    setTimeout(() => {
      setSending(false)
      setShowOtp(true)
      toast.success("OTP ipinadala sa " + phone, {
        description: "Demo: Gamitin ang 123456",
      })
    }, 800)
  }

  const handleVerifyOtp = () => {
    // Demo: accept any 6-digit code
    if (otp.length < 4) {
      toast.error("Pakilagay ang OTP code")
      return
    }
    login("citizen")
    toast.success("Verified ✓", { description: "Maligayang pagdating, Rosario!" })
    router.push("/dashboard")
  }

  return (
    <PhoneFrame>
      <main className="flex flex-col flex-1 px-6 pt-16 pb-8">
        {/* Brand */}
        <div className="flex flex-col items-start gap-5">
          <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Scale className="size-5" strokeWidth={2} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-foreground">eSumbong</h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed text-pretty">
              Barangay justice, made simple. File and track disputes from your phone.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="mt-12">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="mobile" className="text-foreground">
                Mobile number
              </FieldLabel>
              <Input
                id="mobile"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+63 9XX XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 text-base"
                disabled={showOtp}
              />
              <FieldDescription>
                {"We'll text you a 6-digit code to verify your number."}
              </FieldDescription>
            </Field>

            {showOtp && (
              <Field>
                <FieldLabel htmlFor="otp" className="text-foreground">
                  OTP Code
                </FieldLabel>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-12 text-base text-center tracking-[0.3em] font-mono"
                  autoFocus
                />
              </Field>
            )}
          </FieldGroup>

          {!showOtp ? (
            <Button
              size="lg"
              className="w-full h-12 mt-6 text-[15px] font-medium"
              onClick={handleSendOtp}
              disabled={sending}
            >
              {sending ? "Nagpapadala..." : "Send OTP"}
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full h-12 mt-6 text-[15px] font-medium"
              onClick={handleVerifyOtp}
            >
              Verify & Login
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-10 flex flex-col items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Barangay Admin Login
          </Link>
          <p className="text-[11px] text-muted-foreground/70 text-center text-balance">
            By continuing you agree to our Terms and acknowledge our Privacy Notice.
          </p>
        </div>
      </main>
    </PhoneFrame>
  )
}
