"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import type {
  Case,
  CaseStatus,
  DisputeNature,
  HearingRecord,
  AiAnalysis,
  SmsLogEntry,
} from "@/lib/types"
import { generateCaseId, generateHearingId, computeDaysRemaining } from "@/lib/types"

// ── Storage key ──────────────────────────────────────────────────
const STORAGE_KEY = "esumbong_cases"
const SMS_LOG_KEY = "esumbong_sms_log"

// ── Seed data (matches current hardcoded UI) ─────────────────────
function seedCases(): Case[] {
  const today = new Date()
  const d = (offset: number) => {
    const dt = new Date(today)
    dt.setDate(dt.getDate() + offset)
    return dt.toISOString().split("T")[0]
  }

  return [
    {
      id: "BRG-2026-0041",
      complainant: { name: "Rosario dela Cruz", phone: "+639175550142" },
      respondent: { name: "Ernesto Valdez", phone: "+639185550199" },
      nature: "property_damage",
      description:
        "Respondent demolished a shared wall without permission, damaging complainant's storage room. Estimated damage ₱8,500.",
      status: "hearing_scheduled",
      filedDate: d(-20),
      deadlineDate: d(40),
      hearings: [
        {
          id: "h-seed-1a",
          date: d(-13),
          time: "10:00 AM",
          complainantAttended: true,
          respondentAttended: true,
          result: "rescheduled",
        },
        {
          id: "h-seed-1b",
          date: d(-6),
          time: "10:00 AM",
          complainantAttended: true,
          respondentAttended: false,
          result: "rescheduled",
        },
        {
          id: "h-seed-1c",
          date: d(5),
          time: "10:00 AM",
          complainantAttended: null,
          respondentAttended: null,
          result: "pending",
        },
      ],
      noShowCount: 1,
      aiAnalysis: {
        category: "property_damage",
        complexity: "moderate",
        estimatedDays: 35,
        jurisdictionFlag: false,
      },
      cfaApproved: false,
      barangay: "Barangay 459, Sampaloc, Manila",
      smsReminderEnabled: true,
    },
    {
      id: "BRG-2026-0038",
      complainant: { name: "Juan Reyes", phone: "+639175550201" },
      respondent: { name: "Maria Lim", phone: "+639185550202" },
      nature: "noise",
      description:
        "Respondent operates a karaoke business past 10:00 PM nightly, disturbing the entire compound.",
      status: "hearing_scheduled",
      filedDate: d(-42),
      deadlineDate: d(18),
      hearings: [
        {
          id: "h-seed-2a",
          date: d(-28),
          time: "2:00 PM",
          complainantAttended: true,
          respondentAttended: true,
          result: "rescheduled",
        },
        {
          id: "h-seed-2b",
          date: d(3),
          time: "2:00 PM",
          complainantAttended: null,
          respondentAttended: null,
          result: "pending",
        },
      ],
      noShowCount: 0,
      aiAnalysis: {
        category: "noise",
        complexity: "simple",
        estimatedDays: 20,
        jurisdictionFlag: false,
      },
      cfaApproved: false,
      barangay: "Barangay 459, Sampaloc, Manila",
      smsReminderEnabled: true,
    },
    {
      id: "BRG-2026-0035",
      complainant: { name: "Ana Santos", phone: "+639175550301" },
      respondent: { name: "Pedro Cruz", phone: "+639185550302" },
      nature: "debt",
      description:
        "Respondent borrowed ₱15,000 for medical expenses in January 2026 and has not repaid despite multiple verbal promises.",
      status: "mediation",
      filedDate: d(-29),
      deadlineDate: d(31),
      hearings: [
        {
          id: "h-seed-3a",
          date: d(-15),
          time: "9:00 AM",
          complainantAttended: true,
          respondentAttended: true,
          result: "rescheduled",
        },
      ],
      noShowCount: 0,
      aiAnalysis: {
        category: "debt",
        complexity: "simple",
        estimatedDays: 25,
        jurisdictionFlag: false,
      },
      cfaApproved: false,
      barangay: "Barangay 459, Sampaloc, Manila",
      smsReminderEnabled: true,
    },
    {
      id: "BRG-2026-0029",
      complainant: { name: "Lito Bautista", phone: "+639175550401" },
      respondent: { name: "Carmen Sy", phone: "+639185550402" },
      nature: "boundary",
      description:
        "Respondent erected a concrete fence that encroaches approximately 1 meter into complainant's titled lot.",
      status: "mediation",
      filedDate: d(-15),
      deadlineDate: d(45),
      hearings: [
        {
          id: "h-seed-4a",
          date: d(-5),
          time: "3:00 PM",
          complainantAttended: true,
          respondentAttended: true,
          result: "rescheduled",
        },
      ],
      noShowCount: 0,
      aiAnalysis: {
        category: "boundary",
        complexity: "complex",
        estimatedDays: 50,
        jurisdictionFlag: false,
      },
      cfaApproved: false,
      barangay: "Barangay 459, Sampaloc, Manila",
      smsReminderEnabled: true,
    },
  ]
}

// ── Context shape ────────────────────────────────────────────────
interface CaseStoreContextValue {
  cases: Case[]
  smsLog: SmsLogEntry[]
  createCase: (data: {
    complainant: { name: string; phone: string }
    respondent: { name: string; phone: string }
    nature: DisputeNature
    description: string
  }) => Case
  updateCase: (id: string, patch: Partial<Case>) => void
  getCaseById: (id: string) => Case | undefined
  addHearing: (caseId: string, hearing: Omit<HearingRecord, "id">) => void
  recordHearingOutcome: (
    caseId: string,
    hearingId: string,
    data: {
      complainantAttended: boolean
      respondentAttended: boolean
      result: HearingRecord["result"]
    }
  ) => void
  approveCfa: (caseId: string) => void
  addSmsLog: (entry: Omit<SmsLogEntry, "id" | "timestamp">) => void
  resetToSeed: () => void
}

const CaseStoreContext = createContext<CaseStoreContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────
export function CaseStoreProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>([])
  const [smsLog, setSmsLog] = useState<SmsLogEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setCases(JSON.parse(raw))
      } else {
        const seed = seedCases()
        setCases(seed)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      }
    } catch {
      const seed = seedCases()
      setCases(seed)
    }

    try {
      const rawLog = localStorage.getItem(SMS_LOG_KEY)
      if (rawLog) setSmsLog(JSON.parse(rawLog))
    } catch {
      // ignore
    }

    setHydrated(true)
  }, [])

  // Persist cases
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
    }
  }, [cases, hydrated])

  // Persist SMS log
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(SMS_LOG_KEY, JSON.stringify(smsLog))
    }
  }, [smsLog, hydrated])

  const createCase = useCallback(
    (data: {
      complainant: { name: string; phone: string }
      respondent: { name: string; phone: string }
      nature: DisputeNature
      description: string
    }): Case => {
      const now = new Date()
      const deadline = new Date(now)
      deadline.setDate(deadline.getDate() + 60)

      const newCase: Case = {
        id: generateCaseId(),
        complainant: data.complainant,
        respondent: data.respondent,
        nature: data.nature,
        description: data.description,
        status: "filed",
        filedDate: now.toISOString().split("T")[0],
        deadlineDate: deadline.toISOString().split("T")[0],
        hearings: [],
        noShowCount: 0,
        aiAnalysis: null,
        cfaApproved: false,
        barangay: "Barangay 459, Sampaloc, Manila",
        smsReminderEnabled: true,
      }

      setCases((prev) => [newCase, ...prev])
      return newCase
    },
    []
  )

  const updateCase = useCallback((id: string, patch: Partial<Case>) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    )
  }, [])

  const getCaseById = useCallback(
    (id: string) => cases.find((c) => c.id === id),
    [cases]
  )

  const addHearing = useCallback(
    (caseId: string, hearing: Omit<HearingRecord, "id">) => {
      const newHearing: HearingRecord = {
        ...hearing,
        id: generateHearingId(),
      }
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                hearings: [...c.hearings, newHearing],
                status: "hearing_scheduled" as CaseStatus,
              }
            : c
        )
      )
    },
    []
  )

  const recordHearingOutcome = useCallback(
    (
      caseId: string,
      hearingId: string,
      data: {
        complainantAttended: boolean
        respondentAttended: boolean
        result: HearingRecord["result"]
      }
    ) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c

          const updatedHearings = c.hearings.map((h) =>
            h.id === hearingId
              ? {
                  ...h,
                  complainantAttended: data.complainantAttended,
                  respondentAttended: data.respondentAttended,
                  result: data.result,
                }
              : h
          )

          // Count respondent no-shows
          const noShowCount = updatedHearings.filter(
            (h) => h.respondentAttended === false
          ).length

          // Determine new status
          let newStatus: CaseStatus = c.status
          if (data.result === "settled") {
            newStatus = "settled"
          } else if (data.result === "failed") {
            newStatus = noShowCount >= 3 ? "cfa_pending" : "conciliation"
          } else if (data.result === "rescheduled") {
            newStatus = "hearing_scheduled"
          }

          return {
            ...c,
            hearings: updatedHearings,
            noShowCount,
            status: newStatus,
          }
        })
      )
    },
    []
  )

  const approveCfa = useCallback((caseId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              cfaApproved: true,
              cfaApprovedDate: new Date().toISOString(),
              status: "cfa_approved" as CaseStatus,
            }
          : c
      )
    )
  }, [])

  const addSmsLog = useCallback(
    (entry: Omit<SmsLogEntry, "id" | "timestamp">) => {
      const logEntry: SmsLogEntry = {
        ...entry,
        id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        timestamp: new Date().toISOString(),
      }
      setSmsLog((prev) => [logEntry, ...prev])
    },
    []
  )

  const resetToSeed = useCallback(() => {
    const seed = seedCases()
    setCases(seed)
    setSmsLog([])
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    localStorage.removeItem(SMS_LOG_KEY)
  }, [])

  // Don't render children until hydrated (avoid SSR mismatch)
  if (!hydrated) {
    return null
  }

  return (
    <CaseStoreContext.Provider
      value={{
        cases,
        smsLog,
        createCase,
        updateCase,
        getCaseById,
        addHearing,
        recordHearingOutcome,
        approveCfa,
        addSmsLog,
        resetToSeed,
      }}
    >
      {children}
    </CaseStoreContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────
export function useCaseStore() {
  const ctx = useContext(CaseStoreContext)
  if (!ctx) throw new Error("useCaseStore must be used within CaseStoreProvider")
  return ctx
}
