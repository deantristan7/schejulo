// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

export type Status = 'ACTIVE' | 'INACTIVE'
export type StudioType = 'RESERVED' | 'SHARED'
export type StudioStatus = 'AVAILABLE' | 'IN_USE' | 'OFFLINE'
export type WeekType = 'BUSY' | 'NORMAL' | 'LOW'
export type ScheduleStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
export type KpiStatus = 'ON_TRACK' | 'AT_RISK' | 'CRITICAL' | 'COMPLETED'

// ─────────────────────────────────────────
// ENTITIES
// ─────────────────────────────────────────

export interface Admin {
  id: string
  name: string
  telegramId?: string
  status: Status
  createdAt: string
  divisions?: Division[]
}

export interface Division {
  id: string
  name: string
  description?: string
  status: Status
  brands?: Brand[]
  admins?: Admin[]
}

export interface Brand {
  id: string
  divisionId: string
  division?: Division
  name: string
  status: Status
  contracts?: BrandContract[]
  studios?: Studio[]
}

export interface BrandContract {
  id: string
  brandId: string
  periodLabel: string
  contractedHours: number
  validFrom: string
  validUntil: string
}

export interface Studio {
  id: string
  name: string
  studioNumber: number
  reservedBrandId?: string
  reservedBrand?: Brand
  studioType: StudioType
  status: StudioStatus
}

export interface Member {
  id: string
  name: string
  telegramId?: string
  primaryAdminId: string
  primaryAdmin?: Admin
  status: Status
  contracts?: MemberContract[]
}

export interface MemberContract {
  id: string
  memberId: string
  periodLabel: string
  maxHoursPerMonth: number
  maxHoursPerDay: number
  maxSessionHours: number
  minSessionHours: number
  dayOffPerWeek: number
  validFrom: string
  validUntil: string
}

export interface WeekCalendar {
  id: string
  divisionId?: string
  division?: Division
  periodLabel: string
  weekStart: string
  weekEnd: string
  weekType: WeekType
  notes?: string
}

export interface Schedule {
  id: string
  memberId: string
  member?: Member
  brandId: string
  brand?: Brand
  studioId: string
  studio?: Studio
  assignedByAdminId: string
  assignedByAdmin?: Admin
  weekCalendarId?: string
  weekCalendar?: WeekCalendar
  workDate: string
  sessionStart: string
  sessionEnd: string
  sessionHours: number
  sessionNumber: number
  status: ScheduleStatus
  notes?: string
  createdAt: string
}

// ─────────────────────────────────────────
// SUMMARY & KPI
// ─────────────────────────────────────────

export interface WeeklySummary {
  id: string
  memberId: string
  member?: Member
  weekCalendarId: string
  weekCalendar?: WeekCalendar
  totalHours: number
  totalSessions: number
  daysWorked: number
  dayOffUsed: number
  dayOffRemaining: number
  specialCaseTriggered: boolean
  notes?: string
}

export interface MonthlySummary {
  id: string
  memberId: string
  member?: Member
  periodLabel: string
  totalHoursUsed: number
  maxHoursContract: number
  hoursRemaining: number
  status: KpiStatus
}

export interface BrandKpi {
  id: string
  brandId: string
  brand?: Brand
  contractId: string
  periodLabel: string
  contractedHours: number
  achievedHours: number
  remainingHours: number
  achievementPct: number
  status: KpiStatus
}

// ─────────────────────────────────────────
// API RESPONSE WRAPPER
// ─────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ─────────────────────────────────────────
// GENERATE SCHEDULE (AI)
// ─────────────────────────────────────────

export interface GenerateScheduleRequest {
  weekCalendarId: string
  memberIds?: string[]       // kosong = semua member
  brandIds?: string[]        // kosong = semua brand
  prioritizeKpi?: boolean    // true = utamakan brand at risk
  overrideDayOff?: boolean   // true = boleh geser libur (busy week)
}

export interface GenerateScheduleResult {
  schedules: Omit<Schedule, 'id' | 'createdAt'>[]
  warnings: string[]
  kpiImpact: {
    brandId: string
    brandName: string
    hoursAdded: number
    newPct: number
  }[]
  studioConflicts: string[]
}

// ─────────────────────────────────────────
// GOOGLE SHEETS
// ─────────────────────────────────────────

export interface SheetsSyncPayload {
  weekCalendarId: string
  spreadsheetId: string
  sheetName: string
}

export interface SheetsRow {
  member: string
  brand: string
  studio: string
  date: string
  sessionStart: string
  sessionEnd: string
  sessionHours: number
  status: string
}
