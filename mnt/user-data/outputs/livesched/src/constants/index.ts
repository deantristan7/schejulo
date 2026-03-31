// ─────────────────────────────────────────
// BUSINESS RULES
// Semua angka magic ada di sini, jangan hardcode di komponen
// ─────────────────────────────────────────

export const SCHEDULE_RULES = {
  MAX_STUDIOS: 10,
  MAX_HOURS_PER_DAY: 8,
  MAX_SESSION_HOURS: 4,
  MIN_SESSION_HOURS: 2,
  MAX_SESSIONS_PER_DAY: 2,

  // Kontrak >= 160 jam/bulan → 1x libur/minggu
  // Kontrak < 160 jam/bulan  → 2x libur/minggu
  HIGH_CONTRACT_THRESHOLD: 160,
  DAY_OFF_HIGH_CONTRACT: 1,
  DAY_OFF_LOW_CONTRACT: 2,

  // Special case: 3 hari kerja penuh (8 jam) dalam 1 minggu → 4 hari libur
  SPECIAL_CASE_FULL_DAYS: 3,
  SPECIAL_CASE_FULL_DAY_HOURS: 8,
  SPECIAL_CASE_DAY_OFF: 4,
} as const

export const KPI_THRESHOLDS = {
  COMPLETED: 100,
  ON_TRACK: 80,
  AT_RISK: 70,
  // < 70 = CRITICAL
} as const

export const WEEK_TYPES = {
  BUSY: 'BUSY',
  NORMAL: 'NORMAL',
  LOW: 'LOW',
} as const

// Busy week: tanggal 25 (payday) sampai twin date bulan itu
// Twin date: 1/1, 2/2, 3/3, ..., 12/12 → hari ke-X bulan ke-X
// Tapi ini manual input per admin, ini hanya default suggestion
export const BUSY_WEEK_PAYDAY = 25

export const PERIOD_LABEL_FORMAT = 'yyyy-MM' // date-fns format

// ─────────────────────────────────────────
// GOOGLE SHEETS
// ─────────────────────────────────────────

export const SHEETS_CONFIG = {
  SCHEDULE_SHEET_NAME: 'Jadwal',
  MEMBERS_SHEET_NAME: 'Members',
  KPI_SHEET_NAME: 'KPI Brand',
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ],
  // Header kolom sheet jadwal
  SCHEDULE_HEADERS: [
    'No',
    'Tanggal',
    'Hari',
    'Member',
    'Brand',
    'Divisi',
    'Studio',
    'Sesi',
    'Jam Mulai',
    'Jam Selesai',
    'Durasi (jam)',
    'Status',
    'Keterangan',
  ],
  KPI_HEADERS: [
    'Brand',
    'Divisi',
    'Target Jam',
    'Tercapai',
    'Sisa',
    'Achievement %',
    'Status',
  ],
} as const

// ─────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────

export const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'KPI Brand', href: '/kpi', icon: 'TrendingUp' },
    ],
  },
  {
    section: 'Jadwal',
    items: [
      { label: 'Generate jadwal', href: '/generate', icon: 'Sparkles' },
      { label: 'Lihat jadwal', href: '/schedule', icon: 'CalendarDays' },
      { label: 'Studio live', href: '/studios', icon: 'Monitor' },
    ],
  },
  {
    section: 'Master data',
    items: [
      { label: 'Members', href: '/master/members', icon: 'Users' },
      { label: 'Admins', href: '/master/admins', icon: 'UserCog' },
      { label: 'Divisi & brand', href: '/master/divisions', icon: 'Layers' },
      { label: 'Kalender minggu', href: '/master/calendar', icon: 'Calendar' },
    ],
  },
] as const
