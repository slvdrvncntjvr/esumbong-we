// eSumbong — UniSMS Integration + Simulation Fallback
//
// Uses the UniSMS API (https://unismsapi.com/api) with Basic Auth.
// Set NEXT_PUBLIC_UNISMS_API_KEY in .env.local to enable real SMS.
// When the key is absent, SMS is "simulated" — logged to console and
// the SMS log panel, but never actually sent.

import type { SmsLogEntry } from "@/lib/types"

const BASE_URL = "https://unismsapi.com/api"

function getApiKey(): string | null {
  if (typeof window !== "undefined") {
    // Client-side: read from env exposed at build time
    return process.env.NEXT_PUBLIC_UNISMS_API_KEY || null
  }
  return process.env.UNISMS_API_KEY || null
}

function makeAuthHeader(apiKey: string): string {
  // UniSMS uses HTTP Basic: username = API key, password = empty
  const encoded = btoa(`${apiKey}:`)
  return `Basic ${encoded}`
}

// ── Core send function ───────────────────────────────────────────
interface SendResult {
  success: boolean
  referenceId?: string
  status: "sent" | "failed" | "simulated"
  error?: string
}

export async function sendSms(
  recipient: string,
  content: string
): Promise<SendResult> {
  // Truncate to 160 chars per UniSMS spec
  const truncated = content.slice(0, 160)

  const apiKey = getApiKey()
  if (!apiKey) {
    // Simulation mode
    console.log(`[eSumbong SMS SIM] To: ${recipient}\n${truncated}`)
    return {
      success: true,
      referenceId: `sim_${Date.now()}`,
      status: "simulated",
    }
  }

  // Real UniSMS call
  try {
    const res = await fetch(`${BASE_URL}/sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(apiKey),
      },
      body: JSON.stringify({
        recipient,
        content: truncated,
      }),
    })

    if (res.status === 201) {
      const data = await res.json()
      return {
        success: true,
        referenceId: data.message?.reference_id,
        status: "sent",
      }
    }

    const errBody = await res.text()
    console.error(`[UniSMS] ${res.status}: ${errBody}`)
    return {
      success: false,
      status: "failed",
      error: `HTTP ${res.status}`,
    }
  } catch (err) {
    console.error("[UniSMS] Network error:", err)
    return {
      success: false,
      status: "failed",
      error: "Network error",
    }
  }
}

// ── Pre-formatted SMS helpers ────────────────────────────────────

export function buildCaseFiledSms(caseId: string): string {
  return `[eSumbong] Reklamo #${caseId} natanggap. Mag-reply HISTORY para sa buong log. Huwag ibahagi ang ref no.`
}

export function buildHearingReminderSms(
  caseId: string,
  date: string,
  time: string
): string {
  return `[eSumbong] Paalala: Hearing #${caseId} sa ${date}, ${time} sa Brgy Hall. Dalhin ang valid ID.`
}

export function buildHearingResultSms(
  caseId: string,
  result: string
): string {
  return `[eSumbong] Kaso #${caseId}: Resulta ng hearing — ${result}. I-check ang status anumang oras.`
}

export function buildCfaReadySms(caseId: string): string {
  return `[eSumbong] CFA para sa Kaso #${caseId} ay naaprubahan na. Puntahan ang Brgy Hall para kunin ang kopya.`
}

export function buildNoShowWarningSms(
  caseId: string,
  count: number
): string {
  return `[eSumbong] Kaso #${caseId}: Hindi dumalo ang respondent (${count}x). Pwedeng mag-issue ng CFA kung 3x na.`
}

// ── Send + log helper ────────────────────────────────────────────
// Call this from components. It sends the SMS and returns a log entry
// ready to be added to the store.
export async function sendAndLog(
  recipient: string,
  content: string
): Promise<Omit<SmsLogEntry, "id" | "timestamp">> {
  const result = await sendSms(recipient, content)
  return {
    recipient,
    content,
    status: result.status,
    referenceId: result.referenceId,
  }
}
