// eSumbong — AI Dispute Categorization
//
// Keyword-based categorization that runs instantly with zero API calls.
// This gives the same UX as Gemini — the secretary sees a category badge
// and complexity indicator on every case.

import type { AiAnalysis, DisputeNature, AiComplexity } from "@/lib/types"

// Keyword → category mapping (Filipino + English)
const KEYWORD_MAP: { keywords: string[]; category: DisputeNature }[] = [
  {
    keywords: [
      "pader", "wall", "gate", "bakod", "fence", "sira", "damage",
      "property", "ari-arian", "basag", "pintura", "bubong", "roof",
      "gripo", "tubo", "pipe", "istruktura", "demolish",
    ],
    category: "property_damage",
  },
  {
    keywords: [
      "ingay", "noise", "karaoke", "videoke", "maingay", "gabi",
      "tulog", "basura", "amoy", "smoke", "usok", "nuisance", "abala",
    ],
    category: "noise",
  },
  {
    keywords: [
      "utang", "debt", "bayad", "pera", "money", "hiram", "loan",
      "pautang", "hindi nagbabayad", "hindi nagbayad", "sinisingil",
      "payment", "borrow",
    ],
    category: "debt",
  },
  {
    keywords: [
      "lupa", "land", "hangganan", "boundary", "titulo", "title",
      "lot", "encroach", "bakuran", "property line", "survey",
      "metro", "meter",
    ],
    category: "boundary",
  },
  {
    keywords: [
      "saktan", "injury", "suntok", "punch", "hit", "bugbog",
      "sigaw", "threat", "banta", "harassment", "pananakit",
      "pinsala sa katawan",
    ],
    category: "personal_injury",
  },
]

// Complexity heuristics per category
const COMPLEXITY_MAP: Record<DisputeNature, { complexity: AiComplexity; days: number }> = {
  noise: { complexity: "simple", days: 20 },
  debt: { complexity: "simple", days: 25 },
  property_damage: { complexity: "moderate", days: 35 },
  boundary: { complexity: "complex", days: 50 },
  personal_injury: { complexity: "complex", days: 45 },
  other: { complexity: "moderate", days: 30 },
}

// Criminal keywords that suggest the case might be outside KP jurisdiction
const CRIMINAL_KEYWORDS = [
  "pulis", "police", "krimen", "crime", "droga", "drug", "armas",
  "weapon", "saksak", "stab", "patay", "kill", "rape", "kidnap",
  "holdup", "robbery", "nakaw", "theft", "bril", "gun",
]

export function categorizeDispute(description: string): AiAnalysis {
  const lower = description.toLowerCase()

  // Check jurisdiction
  const jurisdictionFlag = CRIMINAL_KEYWORDS.some((kw) => lower.includes(kw))
  const jurisdictionNote = jurisdictionFlag
    ? "Ang kasong ito ay maaaring kriminal. Kailangan i-refer sa pulis o korte, hindi sakop ng KP."
    : undefined

  // Find best category match by counting keyword hits
  let bestCategory: DisputeNature = "other"
  let bestScore = 0

  for (const entry of KEYWORD_MAP) {
    const score = entry.keywords.filter((kw) => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestCategory = entry.category
    }
  }

  const { complexity, days } = COMPLEXITY_MAP[bestCategory]

  return {
    category: bestCategory,
    complexity,
    estimatedDays: days,
    jurisdictionFlag,
    jurisdictionNote,
  }
}

// Complexity display helpers
export const COMPLEXITY_LABELS: Record<AiComplexity, string> = {
  simple: "Simple",
  moderate: "Moderate",
  complex: "Complex",
}

export const COMPLEXITY_COLORS: Record<AiComplexity, string> = {
  simple: "bg-success/15 text-success ring-success/30",
  moderate: "bg-warning/15 text-warning-foreground ring-warning/30",
  complex: "bg-destructive/12 text-destructive ring-destructive/25",
}
