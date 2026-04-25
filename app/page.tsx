"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Scale, FileText, List, Bell, ChevronRight, ArrowRight, Check, Clock, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { DISPUTE_LABELS } from "@/lib/types"
import type { DisputeNature } from "@/lib/types"

// ── Sample data for the interactive phone ────────────────────────
const SAMPLE_CASES = [
  { id: "BRG-2026-0041", complainant: "Rosario dela Cruz", respondent: "Ernesto Valdez", nature: "property_damage" as DisputeNature, days: 6, urgency: "critical" as const },
  { id: "BRG-2026-0038", complainant: "Juan Reyes", respondent: "Maria Lim", nature: "noise" as DisputeNature, days: 18, urgency: "warning" as const },
  { id: "BRG-2026-0035", complainant: "Ana Santos", respondent: "Pedro Cruz", nature: "debt" as DisputeNature, days: 31, urgency: "normal" as const },
  { id: "BRG-2026-0029", complainant: "Lito Bautista", respondent: "Carmen Sy", nature: "boundary" as DisputeNature, days: 45, urgency: "normal" as const },
]

const URGENCY_BADGE: Record<string, { label: string; cls: string }> = {
  critical: { label: "Kritikal", cls: "bg-red-500/15 text-red-600 ring-red-500/30" },
  warning: { label: "Pansin", cls: "bg-amber-500/15 text-amber-600 ring-amber-500/30" },
  normal: { label: "Maayos", cls: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/30" },
}

// ── Landing Page Component ───────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <StatsBar />
      <ForBarangays />
      <Footer />
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Scale className="size-5 text-[#3B82F6]" strokeWidth={2.5} />
          <span className="text-lg font-bold text-[#3B82F6]">eSumbong</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-[#475569] hover:text-[#0F172A] transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-[#475569] hover:text-[#0F172A] transition-colors">How It Works</a>
          <a href="#for-barangays" className="text-sm text-[#475569] hover:text-[#0F172A] transition-colors">For Barangays</a>
          <a href="#for-barangays" className="text-sm border border-[#3B82F6] text-[#3B82F6] px-4 py-2 rounded-lg hover:bg-[#3B82F6] hover:text-white transition-all">
            Request Pilot
          </a>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
      {/* Left — Text */}
      <div className="space-y-6">
        <span className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#3B82F6] text-xs font-medium px-3 py-1.5 rounded-full">
          InnOlympics 2026 · Track C
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-[#0F172A] leading-tight tracking-tight">
          Justice starts in the barangay.
        </h1>
        <p className="text-lg text-[#475569] leading-relaxed max-w-lg">
          eSumbong digitizes the Katarungang Pambarangay — automated hearing reminders, real-time case tracking, zero paperwork.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/login" className="inline-flex items-center gap-2 bg-[#3B82F6] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#2563EB] transition-colors hover:scale-[1.02] active:scale-[0.98]">
            See It In Action <ArrowRight className="size-4" />
          </Link>
          <a href="#how-it-works" className="inline-flex items-center gap-2 border border-[#E2E8F0] text-[#0F172A] px-6 py-3 rounded-xl font-medium hover:bg-[#F1F5F9] transition-colors">
            Learn More
          </a>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          {["500,000+ cases/year", "42,047 barangays", "60-day legal limit"].map((s) => (
            <span key={s} className="text-xs text-[#475569] bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-full">{s}</span>
          ))}
        </div>
      </div>

      {/* Right — Interactive Phone */}
      <div className="flex justify-center">
        <InteractivePhone />
      </div>
    </section>
  )
}

// ── Interactive Phone Frame ──────────────────────────────────────
function InteractivePhone() {
  const [activeTab, setActiveTab] = useState<"file" | "cases" | "status">("cases")
  const [selectedCase, setSelectedCase] = useState<string | null>(null)

  const tabs = [
    { id: "file" as const, label: "Mag-ulat", icon: FileText },
    { id: "cases" as const, label: "Mga Kaso", icon: List },
    { id: "status" as const, label: "Status", icon: Bell },
  ]

  return (
    <div className="animate-float">
      <div className="w-[280px] h-[560px] rounded-[36px] border-[3px] border-[#CBD5E1] bg-[#1E293B] p-[6px] shadow-2xl shadow-slate-300/50">
        <div className="w-full h-full rounded-[28px] bg-white overflow-hidden flex flex-col">
          {/* Screen content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "file" && <PhoneFileScreen />}
            {activeTab === "cases" && <PhoneCasesScreen onSelect={setSelectedCase} />}
            {activeTab === "status" && <PhoneStatusScreen />}
          </div>

          {/* Bottom nav */}
          <div className="border-t border-[#E2E8F0] bg-white">
            <div className="grid grid-cols-3">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setSelectedCase(null) }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                    activeTab === id ? "text-[#3B82F6]" : "text-[#94A3B8]"
                  )}
                >
                  <Icon className="size-4" strokeWidth={activeTab === id ? 2.25 : 1.75} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Case detail modal */}
      {selectedCase && (
        <CaseDetailModal caseId={selectedCase} onClose={() => setSelectedCase(null)} />
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

// ── Phone Screen: File ───────────────────────────────────────────
function PhoneFileScreen() {
  return (
    <div className="p-4 bg-[#EFF6FF] min-h-full">
      <h2 className="text-sm font-bold text-[#3B82F6] mb-3">Bagong Reklamo</h2>
      <div className="space-y-2.5">
        {[
          { label: "Inyong Pangalan *", placeholder: "Juan dela Cruz" },
          { label: "Inyong Numero *", placeholder: "+63 9XX XXX XXXX" },
          { label: "Pangalan ng Respondent *", placeholder: "Pangalan" },
        ].map((f) => (
          <div key={f.label}>
            <label className="text-[10px] font-medium text-[#334155]">{f.label}</label>
            <input className="w-full h-8 text-[11px] px-2.5 rounded-lg border border-[#E2E8F0] bg-white mt-0.5 outline-none focus:ring-1 focus:ring-[#3B82F6]/40" placeholder={f.placeholder} readOnly />
          </div>
        ))}
        <div>
          <label className="text-[10px] font-medium text-[#334155]">Numero ng Respondent <span className="text-[#94A3B8]">(opsyonal)</span></label>
          <input className="w-full h-8 text-[11px] px-2.5 rounded-lg border border-[#E2E8F0] bg-white mt-0.5 outline-none" placeholder="+63 9XX XXX XXXX" readOnly />
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#334155]">Uri ng Reklamo</label>
          <select className="w-full h-8 text-[11px] px-2.5 rounded-lg border border-[#E2E8F0] bg-white mt-0.5 text-[#94A3B8]">
            <option>Pumili ng kategorya</option>
            <option>Pinsala sa Ari-arian</option>
            <option>Ingay</option>
            <option>Utang</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#334155]">Maikling Paglalarawan</label>
          <textarea className="w-full h-16 text-[11px] px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white mt-0.5 resize-none outline-none" placeholder="Ano ang nangyari?" readOnly />
          <p className="text-[9px] text-[#94A3B8] text-right">0/500</p>
        </div>
        <button className="w-full h-9 bg-[#3B82F6] text-white text-[11px] font-medium rounded-lg hover:bg-[#2563EB] transition-colors">
          Isumite ang Reklamo
        </button>
        <p className="text-[9px] text-[#94A3B8] text-center">Makakatanggap kayo ng SMS na may reference number.</p>
      </div>
    </div>
  )
}

// ── Phone Screen: Cases ──────────────────────────────────────────
function PhoneCasesScreen({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="p-3 space-y-2">
      <h2 className="text-xs font-bold text-[#0F172A] px-1">Mga Kaso</h2>
      {SAMPLE_CASES.map((c) => {
        const badge = URGENCY_BADGE[c.urgency]
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="w-full text-left rounded-xl bg-white border border-[#E2E8F0] p-3 hover:shadow-md transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#3B82F6]">{c.id}</span>
              <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full ring-1", badge.cls)}>{badge.label}</span>
            </div>
            <div className="text-[10px] text-[#475569]">
              {c.complainant} <span className="text-[#94A3B8]">→</span> {c.respondent}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] bg-[#EFF6FF] text-[#3B82F6] px-1.5 py-0.5 rounded-full">{DISPUTE_LABELS[c.nature]}</span>
              <span className={cn("text-[9px] font-medium", c.urgency === "critical" ? "text-red-500" : c.urgency === "warning" ? "text-amber-500" : "text-emerald-500")}>
                {c.days} araw na natitira
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Phone Screen: Status ─────────────────────────────────────────
function PhoneStatusScreen() {
  const timeline = [
    { label: "Naihain", date: "Mar 15, 2026", done: true },
    { label: "Unang Hearing", date: "Mar 22, 2026 · Dumalo", done: true },
    { label: "Ikalawang Hearing", date: "Apr 3, 2026 · Hindi Dumalo (Respondent)", done: true },
    { label: "Ikatlong Hearing", date: "Apr 28, 2026 · Nakabiskedyul", done: false },
  ]

  return (
    <div className="p-3 space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#94A3B8]" />
        <input className="w-full h-8 text-[11px] pl-8 pr-3 rounded-lg border border-[#E2E8F0] bg-white outline-none" defaultValue="BRG-2026-0041" readOnly />
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-[#3B82F6]">BRG-2026-0041</span>
          <span className="text-[9px] font-medium bg-emerald-500/15 text-emerald-600 px-1.5 py-0.5 rounded-full ring-1 ring-emerald-500/30">Aktibo</span>
        </div>

        <div className="relative pl-4">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[#E2E8F0]" />
          {timeline.map((t, i) => (
            <div key={i} className="relative flex items-start gap-2.5 pb-3 last:pb-0">
              <div className={cn(
                "absolute left-[-11px] size-3 rounded-full border-2 mt-0.5",
                t.done ? "bg-emerald-500 border-emerald-500" : "bg-white border-amber-400"
              )}>
                {t.done && <Check className="size-2 text-white absolute top-0 left-0.5" strokeWidth={3} />}
                {!t.done && <Clock className="size-2 text-amber-400 absolute top-0 left-0.5" strokeWidth={2.5} />}
              </div>
              <div>
                <p className={cn("text-[10px] font-medium", t.done ? "text-[#0F172A]" : "text-amber-600")}>{t.label}</p>
                <p className="text-[9px] text-[#94A3B8]">{t.date}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[#EFF6FF] px-3 py-2">
          <span className="text-[10px] text-[#334155]">I-on ang SMS Paalala</span>
          <div className="w-8 h-4 rounded-full bg-[#3B82F6] relative cursor-pointer">
            <div className="absolute right-0.5 top-0.5 size-3 rounded-full bg-white" />
          </div>
        </div>
        <p className="text-[8px] text-[#94A3B8]">Makakatanggap ng paalala 24 oras bago ang hearing.</p>
      </div>
    </div>
  )
}

// ── Case Detail Modal ────────────────────────────────────────────
function CaseDetailModal({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const c = SAMPLE_CASES.find((x) => x.id === caseId)
  if (!c) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-[280px] max-h-[400px] rounded-t-2xl bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-200 mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-[#3B82F6]">{c.id}</p>
            <p className="text-[11px] font-medium text-[#0F172A]">{DISPUTE_LABELS[c.nature]}</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] text-lg">✕</button>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div className="space-y-1.5">
            <div><span className="text-[9px] text-[#94A3B8]">Nagrereklamo</span><p className="text-[11px] text-[#0F172A]">{c.complainant}</p></div>
            <div><span className="text-[9px] text-[#94A3B8]">Respondent</span><p className="text-[11px] text-[#0F172A]">{c.respondent}</p></div>
          </div>
          <div>
            <h4 className="text-[9px] font-medium text-[#94A3B8] uppercase mb-1.5">Hearing History</h4>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#475569]">Mar 22, 2026</span>
                <span className="bg-emerald-500/15 text-emerald-600 px-1.5 py-0.5 rounded-full text-[9px]">Dumalo</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#475569]">Apr 3, 2026</span>
                <span className="bg-red-500/15 text-red-600 px-1.5 py-0.5 rounded-full text-[9px]">Hindi Dumalo</span>
              </div>
            </div>
          </div>
          <button className="w-full h-8 bg-[#3B82F6] text-white text-[10px] font-medium rounded-lg">
            Mag-iskedyul ng Hearing
          </button>
        </div>
      </div>
    </div>
  )
}

// ── How It Works ─────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: "📋", title: "Mag-ulat Online", desc: "Ihain ang reklamo kahit saan. Walang pisikal na pagbisita sa barangay." },
    { icon: "📱", title: "Awtomatikong SMS", desc: "Parehong partido ay makakatanggap ng paalala bago ang bawat hearing." },
    { icon: "🕐", title: "I-track ang Kaso", desc: "Makita ang status ng inyong kaso anumang oras gamit ang inyong reference number." },
  ]
  return (
    <section id="how-it-works" className="bg-[#EFF6FF] py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-12">Paano gumagana ang eSumbong?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl p-8 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{s.title}</h3>
              <p className="text-sm text-[#475569] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Stats Bar ────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: "425,263", label: "Kaso bawat taon" },
    { value: "60 araw", label: "Legal na limitasyon" },
    { value: "42,047", label: "Barangay sa Pilipinas" },
    { value: "₱3.1B", label: "Natipid ng gobyerno" },
  ]
  return (
    <section className="bg-[#1E3A8A] py-12">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
            <p className="text-sm text-blue-200 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── For Barangays CTA ────────────────────────────────────────────
function ForBarangays() {
  return (
    <section id="for-barangays" className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Para sa mga Barangay at LGU</h2>
        <p className="text-[#475569] text-lg">Makipagtulungan sa amin para sa pilot deployment sa inyong lungsod.</p>
        <a href="mailto:esumbong@example.com" className="inline-flex items-center gap-2 bg-[#3B82F6] text-white px-8 py-3.5 rounded-xl font-medium text-lg hover:bg-[#2563EB] transition-colors hover:scale-[1.02] active:scale-[0.98]">
          Makipag-ugnayan
        </a>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          {["Libreng pilot para sa 3 barangay", "Firebase-secured data", "DILG-aligned reporting"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-sm text-[#475569]">
              <Check className="size-4 text-[#10B981]" strokeWidth={2.5} /> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Scale className="size-5 text-[#3B82F6]" />
          <span className="font-bold text-lg">eSumbong</span>
          <span className="text-sm text-[#64748B] ml-2">Barangay justice, digitized.</span>
        </div>
        <div className="flex gap-6 text-sm text-[#94A3B8]">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Legal</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}
