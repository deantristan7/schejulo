// ─────────────────────────────────────────
// BUSINESS RULES
// ─────────────────────────────────────────

export const SCHEDULE_RULES = {
  MAX_HOURS_PER_DAY: 8,
  MAX_SESSIONS_PER_DAY: 2,
  MIN_SESSION_HOURS: 2,
  MAX_SESSION_HOURS: 4,
  TOTAL_STUDIOS: 10,
} as const

export const CONTRACT_RULES = {
  HIGH_CONTRACT_THRESHOLD: 160,   // >= 160 jam/bulan → 1x libur/minggu
  HIGH_CONTRACT_DAY_OFF: 1,
  LOW_CONTRACT_DAY_OFF: 2,
  SPECIAL_CASE_FULL_DAYS: 3,      // 3 hari full 8 jam → 4 hari libur
  SPECIAL_CASE_DAY_OFF: 4,
} as const

export const KPI_THRESHOLDS = {
  COMPLETED: 100,
  ON_TRACK: 80,
  AT_RISK: 70,
  // < 70 = CRITICAL
} as const

// ─────────────────────────────────────────
// BUSY WEEK DEFAULT
// ─────────────────────────────────────────

export const BUSY_WEEK_DEFAULT = {
  PAYDAY: 25, // tanggal 25 (payday)
  // twin date = 1/1, 2/2, 3/3, dst (bulan = tanggal)
} as const

// ─────────────────────────────────────────
// PERIOD LABEL FORMAT
// ─────────────────────────────────────────

export const PERIOD_LABEL_FORMAT = 'yyyy-MM' // e.g. "2026-03"

// ─────────────────────────────────────────
// SESSION NUMBER COLORS (UI)
// ─────────────────────────────────────────

export const SESSION_COLORS = {
  1: 'blue',
  2: 'green',
  3: 'purple',
} as const

// ─────────────────────────────────────────
// WEEK TYPE COLORS (UI)
// ─────────────────────────────────────────

export const WEEK_TYPE_COLORS = {
  BUSY: 'yellow',
  NORMAL: 'white',
  LOW: 'gray',
} as const

// ─────────────────────────────────────────
// STUDIO TYPE COLORS (UI)
// ─────────────────────────────────────────

export const STUDIO_COLORS = {
  RESERVED: 'purple',
  SHARED: 'green',
  OFFLINE: 'gray',
} as const
