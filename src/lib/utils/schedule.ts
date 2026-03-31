import { SCHEDULE_RULES, CONTRACT_RULES, KPI_THRESHOLDS } from '@/constants'
import type { KpiStatus } from '@/types'

// ─────────────────────────────────────────
// VALIDATE MEMBER SESSION
// ─────────────────────────────────────────

export interface ValidateMemberSessionInput {
  existingSessionsToday: number
  existingHoursToday: number
  existingHoursThisMonth: number
  maxHoursPerMonth: number
  maxHoursPerDay?: number
  sessionHours: number
}

export interface ValidationResult {
  valid: boolean
  reason?: string
}

export function validateMemberSession(input: ValidateMemberSessionInput): ValidationResult {
  const maxPerDay = input.maxHoursPerDay ?? SCHEDULE_RULES.MAX_HOURS_PER_DAY

  if (input.existingSessionsToday >= SCHEDULE_RULES.MAX_SESSIONS_PER_DAY) {
    return { valid: false, reason: `Member sudah ${SCHEDULE_RULES.MAX_SESSIONS_PER_DAY} sesi hari ini` }
  }

  if (input.existingHoursToday + input.sessionHours > maxPerDay) {
    return { valid: false, reason: `Melebihi max ${maxPerDay} jam/hari` }
  }

  if (input.existingHoursThisMonth + input.sessionHours > input.maxHoursPerMonth) {
    return { valid: false, reason: `Melebihi kontrak ${input.maxHoursPerMonth} jam/bulan` }
  }

  if (input.sessionHours < SCHEDULE_RULES.MIN_SESSION_HOURS || input.sessionHours > SCHEDULE_RULES.MAX_SESSION_HOURS) {
    return {
      valid: false,
      reason: `Durasi sesi harus ${SCHEDULE_RULES.MIN_SESSION_HOURS}–${SCHEDULE_RULES.MAX_SESSION_HOURS} jam`,
    }
  }

  return { valid: true }
}

// ─────────────────────────────────────────
// VALIDATE STUDIO
// ─────────────────────────────────────────

export interface ValidateStudioInput {
  studioReservedBrandId: string | null
  requestingBrandId: string
  concurrentSessionsAtTime: number
}

export function validateStudio(input: ValidateStudioInput): ValidationResult {
  if (input.concurrentSessionsAtTime >= SCHEDULE_RULES.TOTAL_STUDIOS) {
    return { valid: false, reason: 'Semua studio sedang terpakai di jam tersebut' }
  }

  if (input.studioReservedBrandId && input.studioReservedBrandId !== input.requestingBrandId) {
    return { valid: false, reason: 'Studio ini reserved untuk brand lain' }
  }

  return { valid: true }
}

// ─────────────────────────────────────────
// CALCULATE KPI STATUS
// ─────────────────────────────────────────

export function calculateKpiStatus(achievedHours: number, contractedHours: number): KpiStatus {
  const pct = contractedHours > 0 ? (achievedHours / contractedHours) * 100 : 0

  if (pct >= KPI_THRESHOLDS.COMPLETED) return 'COMPLETED'
  if (pct >= KPI_THRESHOLDS.ON_TRACK) return 'ON_TRACK'
  if (pct >= KPI_THRESHOLDS.AT_RISK) return 'AT_RISK'
  return 'CRITICAL'
}

// ─────────────────────────────────────────
// CALCULATE DAY OFF PER WEEK
// ─────────────────────────────────────────

export function calculateDayOffPerWeek(maxHoursPerMonth: number): number {
  return maxHoursPerMonth >= CONTRACT_RULES.HIGH_CONTRACT_THRESHOLD
    ? CONTRACT_RULES.HIGH_CONTRACT_DAY_OFF
    : CONTRACT_RULES.LOW_CONTRACT_DAY_OFF
}
