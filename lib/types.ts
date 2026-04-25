// eSumbong — Core Types
// All shared data shapes live here. Import from "@/lib/types".

export type CaseStatus =
  | "filed"
  | "summoned"
  | "hearing_scheduled"
  | "mediation"
  | "conciliation"
  | "settled"
  | "cfa_pending"
  | "cfa_approved"
  | "dismissed"

export type Urgency = "critical" | "warning" | "normal"

export type DisputeNature =
  | "property_damage"
  | "noise"
  | "debt"
  | "boundary"
  | "personal_injury"
  | "other"

export const DISPUTE_LABELS: Record<DisputeNature, string> = {
  property_damage: "Pinsala sa Ari-arian",
  noise: "Ingay / Abala",
  debt: "Utang",
  boundary: "Alitan sa Hangganan",
  personal_injury: "Pinsala sa Katawan",
  other: "Iba pa",
}

export type AiComplexity = "simple" | "moderate" | "complex"

export interface Party {
  name: string
  phone: string // E.164 format +639XXXXXXXXX
}

export interface HearingRecord {
  id: string
  date: string // ISO date
  time: string // e.g. "10:00 AM"
  complainantAttended: boolean | null // null = not yet recorded
  respondentAttended: boolean | null
  result: "settled" | "rescheduled" | "failed" | "pending"
  notes?: string
}

export interface AiAnalysis {
  category: DisputeNature
  complexity: AiComplexity
  estimatedDays: number
  jurisdictionFlag: boolean // true = might be outside KP jurisdiction
  jurisdictionNote?: string
}

export interface Case {
  id: string // BRG-2026-XXXX
  complainant: Party
  respondent: Party
  nature: DisputeNature
  description: string
  status: CaseStatus
  filedDate: string // ISO date
  deadlineDate: string // ISO date (filedDate + 60 days)
  hearings: HearingRecord[]
  noShowCount: number // respondent no-shows
  aiAnalysis: AiAnalysis | null
  cfaApproved: boolean
  cfaApprovedDate?: string
  barangay: string
  smsReminderEnabled: boolean
}

export interface SmsLogEntry {
  id: string
  timestamp: string
  recipient: string
  content: string
  status: "sent" | "failed" | "simulated"
  referenceId?: string // UniSMS reference_id
}

export type UserRole = "citizen" | "secretary" | "captain"

export interface AuthUser {
  name: string
  phone: string
  role: UserRole
  barangay: string
}

// Helpers
export function computeDaysRemaining(deadlineDate: string): number {
  const deadline = new Date(deadlineDate)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function computeUrgency(daysRemaining: number): Urgency {
  if (daysRemaining < 15) return "critical"
  if (daysRemaining <= 30) return "warning"
  return "normal"
}

export function generateCaseId(): string {
  const year = new Date().getFullYear()
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `BRG-${year}-${seq}`
}

export function generateHearingId(): string {
  return `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function formatPhone(raw: string): string {
  // Normalize to E.164 PH format
  let cleaned = raw.replace(/[^0-9+]/g, "")
  if (cleaned.startsWith("09")) {
    cleaned = "+63" + cleaned.slice(1)
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "+63" + cleaned
  }
  return cleaned
}
