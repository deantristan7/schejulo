// ─────────────────────────────────────────
// Provider-agnostic AI interface
// Swap provider: tinggal ganti di src/lib/ai/client.ts
// ─────────────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIGenerateOptions {
  messages: AIMessage[]
  systemPrompt: string
  temperature?: number
  maxTokens?: number
}

export interface AIProvider {
  chat(options: AIGenerateOptions): Promise<string>
}

// ─────────────────────────────────────────
// Schedule generation types
// ─────────────────────────────────────────

export interface MemberContext {
  id: string
  name: string
  maxHoursPerMonth: number
  maxHoursPerDay: number
  maxSessionHours: number
  minSessionHours: number
  dayOffPerWeek: number
  usedHoursThisMonth: number
  remainingHours: number
}

export interface BrandContext {
  id: string
  name: string
  division: string
  contractedHours: number
  achievedHours: number
  remainingHours: number
  achievementPct: number
  kpiStatus: string
  reservedStudioIds: string[]
}

export interface StudioContext {
  id: string
  name: string
  studioNumber: number
  studioType: 'RESERVED' | 'SHARED'
  reservedBrandId: string | null
  reservedBrandName: string | null
}

export interface GenerateScheduleInput {
  weekStart: string         // 'YYYY-MM-DD'
  weekEnd: string
  weekType: 'BUSY' | 'NORMAL' | 'LOW'
  periodLabel: string       // 'yyyy-MM'
  members: MemberContext[]
  brands: BrandContext[]
  studios: StudioContext[]
  prioritizeKpi?: boolean
  overrideDayOff?: boolean
}

export interface DraftSession {
  memberId: string
  memberName: string
  brandId: string
  brandName: string
  studioId: string
  studioName: string
  workDate: string          // 'YYYY-MM-DD'
  sessionStart: string      // 'HH:mm'
  sessionEnd: string        // 'HH:mm'
  sessionHours: number
  sessionNumber: number
}

export interface GenerateScheduleOutput {
  sessions: DraftSession[]
  warnings: string[]
  kpiImpact: { brandName: string; hoursAdded: number; newPct: number }[]
  summary: string
}
