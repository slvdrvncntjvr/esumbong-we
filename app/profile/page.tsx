"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Bell, Shield, HelpCircle, LogOut, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { PhoneFrame } from "@/components/phone-frame"
import { BottomNav } from "@/components/bottom-nav"
import { useAuth } from "@/lib/auth"
import { useCaseStore } from "@/lib/store"

const items = [
  { label: "Mga Notification", icon: Bell, href: "#" },
  { label: "Privacy at Data", icon: Shield, href: "#" },
  { label: "Tulong at Suporta", icon: HelpCircle, href: "#" },
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { resetToSeed } = useCaseStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleReset = () => {
    resetToSeed()
    toast.info("Demo data na-reset.")
  }

  return (
    <PhoneFrame>
      <div className="flex flex-col flex-1">
        <header className="px-6 pt-10 pb-6">
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Profile</h1>
        </header>

        <main className="flex-1 px-6 pb-24 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[16px] font-semibold">
              {user?.name?.charAt(0) ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-foreground">{user?.name ?? "User"}</p>
              <p className="text-[12px] text-muted-foreground">{user?.phone ?? ""} · {user?.barangay ?? ""}</p>
            </div>
          </div>

          <ul className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {items.map(({ label, icon: Icon, href }) => (
              <li key={label}>
                <Link href={href} className="flex items-center gap-3 px-4 py-3.5 text-[14px] text-foreground hover:bg-muted/60 transition-colors">
                  <Icon className="size-[18px] text-muted-foreground" strokeWidth={1.75} />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
                </Link>
              </li>
            ))}
          </ul>

          <button onClick={handleReset} className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 w-full text-[14px] font-medium text-muted-foreground hover:bg-muted/60 transition-colors">
            <RotateCcw className="size-4" strokeWidth={2} />
            I-reset ang Demo Data
          </button>

          <button onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 w-full text-[14px] font-medium text-destructive hover:bg-destructive/5 transition-colors">
            <LogOut className="size-4" strokeWidth={2} />
            Mag-sign out
          </button>
        </main>

        <BottomNav />
      </div>
    </PhoneFrame>
  )
}
