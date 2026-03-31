# Schejulo — Project Context

> Dokumen ini adalah ringkasan lengkap keputusan desain, ERD, business rules, dan next steps
> untuk project Schejulo. Baca ini sebelum mulai coding apapun.

---

## Overview

**Schejulo** adalah web app untuk schedule maker live host e-commerce.
Dibangun dengan **Next.js 14 (App Router)**, database **PostgreSQL via Prisma**,
terintegrasi dengan **Google Sheets API**, dan punya fitur utama **AI chatbot untuk generate jadwal otomatis**.

---

## Hierarki Organisasi

```
Admin (Telco / Tele Coordinator)
  └── punya beberapa Divisi (Beauty, Puma, Lock n Lock, dll)
        └── setiap Divisi punya beberapa Brand (Somethinc, Sulwhasoo, Puma Run, dll)
              └── setiap Brand punya kontrak jam live per bulan

Member (Live Host)
  └── punya 1 primary admin (pemilik)
  └── BISA dipinjam admin lain untuk diassign ke brand manapun
  └── punya kontrak jam per bulan (bisa beda-beda tiap periode)
```

---

## Entitas & Relasi (ERD Final — v3)

### Tabel utama

| Tabel | Fungsi |
|---|---|
| `admins` | Admin / Telco |
| `divisions` | Divisi (Beauty, Puma, dll) |
| `admin_divisions` | Junction many-to-many admin ↔ divisi |
| `brands` | Brand klien per divisi (Somethinc, Sulwhasoo, dll) |
| `brand_contracts` | Kontrak jam per brand per bulan |
| `studios` | 10 studio live, bisa reserved per brand atau shared |
| `members` | Live host |
| `member_contracts` | Kontrak jam per member per bulan (bisa beda tiap periode) |
| `week_calendars` | Tipe minggu per divisi: BUSY / NORMAL / LOW |
| `schedules` | Sesi live (1 baris = 1 sesi, bukan 1 hari) |
| `weekly_summaries` | Rekap jam + libur per member per minggu (auto-generated) |
| `monthly_summaries` | Rekap jam per member per bulan (auto-generated) |
| `brand_kpis` | KPI pencapaian jam per brand per bulan (auto-generated) |
| `bot_logs` | Audit trail semua aksi |

### Relasi penting
- `Admin` → many-to-many → `Division` (via `admin_divisions`)
- `Division` → one-to-many → `Brand`
- `Brand` → one-to-many → `BrandContract`
- `Studio` → optional belongs-to → `Brand` (reserved; null = shared)
- `Member` → belongs-to → `Admin` (primary owner)
- `Member` → one-to-many → `MemberContract`
- `Schedule` → belongs-to → `Member`, `Brand`, `Studio`, `Admin`, `WeekCalendar`

---

## Business Rules (WAJIB DIIMPLEMENTASI)

### Aturan sesi harian
- 1 hari maksimal **8 jam** per member
- 1 hari maksimal **2 sesi** per member
- Durasi per sesi: **2–4 jam** (min/max bisa di-override per kontrak)
- 1 sesi = 1 member pakai 1 studio

### Aturan libur mingguan
- Kontrak **>= 160 jam/bulan** → libur **1x per minggu**
- Kontrak **< 160 jam/bulan** → libur **2x per minggu**
- **Special case**: kalau dalam 1 minggu sudah 3 hari penuh 8 jam → dapat libur 4 hari

### Busy week & libur
- Saat **busy week**, libur bisa **digeser atau dikurangi** (admin boleh override)
- Busy week di-input manual oleh admin per bulan per divisi
- Default patokan busy week: tanggal **25 (payday)** sampai twin date bulan itu (1/1, 2/2, 3/3, dst)

### Aturan studio
- Total **10 studio** — max **10 sesi concurrent** di jam yang sama
- Studio bisa **reserved** untuk brand tertentu → brand lain tidak boleh pakai
- Studio bisa **shared** (nullable `reserved_brand_id`) → siapa aja bisa pakai
- Saat generate jadwal, AI harus cek ketersediaan studio di jam yang overlap

### KPI brand
- Setiap brand punya kontrak jam live per bulan (misal Puma = 300 jam)
- `achieved_hours` di `brand_kpis` nambah otomatis setiap sesi confirmed
- Status KPI:
  - `COMPLETED` : >= 100%
  - `ON_TRACK`  : >= 80%
  - `AT_RISK`   : >= 70%
  - `CRITICAL`  : < 70%

### Jam member per bulan
- `max_hours_per_month` bisa beda per member per periode (60 / 80 / 120 / 160 jam)
- Kontrak disimpan di `member_contracts` dengan `period_label` format `"yyyy-MM"`
- Sisa jam = `max_hours_per_month - total jam sesi confirmed bulan itu`

---

## Tech Stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js |
| State | Zustand |
| Data fetching | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| UI base | Tailwind CSS + Radix UI |
| Table | TanStack Table |
| Google Sheets | googleapis (Node.js SDK) |
| AI chatbot | Claude API (claude-sonnet-4-20250514) |
| Toast | react-hot-toast |
| Icons | lucide-react |

---

## Struktur Folder

```
Schejulo/
├── prisma/
│   ├── schema.prisma          ✅ DONE
│   └── seed.ts                ⬜ TODO
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         ⬜ TODO
│   │   ├── page.tsx           ⬜ TODO (redirect ke /dashboard)
│   │   ├── auth/login/        ⬜ TODO
│   │   ├── dashboard/         ⬜ TODO
│   │   ├── kpi/               ⬜ TODO
│   │   ├── generate/          ⬜ TODO (halaman chatbot AI)
│   │   ├── schedule/          ⬜ TODO (calendar view)
│   │   ├── studios/           ⬜ TODO (grid 10 studio)
│   │   ├── master/
│   │   │   ├── members/       ⬜ TODO
│   │   │   ├── admins/        ⬜ TODO
│   │   │   ├── divisions/     ⬜ TODO (include brands)
│   │   │   └── calendar/      ⬜ TODO (week type input)
│   │   └── api/
│   │       ├── auth/          ⬜ TODO
│   │       ├── members/       ⬜ TODO
│   │       ├── admins/        ⬜ TODO
│   │       ├── divisions/     ⬜ TODO
│   │       ├── brands/        ⬜ TODO
│   │       ├── studios/       ⬜ TODO
│   │       ├── schedules/     ⬜ TODO
│   │       ├── weekly-summary/⬜ TODO
│   │       ├── monthly-summary/⬜TODO
│   │       ├── brand-kpi/     ⬜ TODO
│   │       ├── week-calendar/ ⬜ TODO
│   │       ├── generate/      ⬜ TODO (AI generate jadwal)
│   │       └── sheets/
│   │           ├── sync/      ⬜ TODO (auto-sync ke Sheets)
│   │           └── export/    ⬜ TODO (manual export CSV/Sheets)
│   │
│   ├── components/
│   │   ├── ui/                ⬜ TODO (Button, Input, Select, Modal, Table, Badge, dll)
│   │   ├── layout/            ⬜ TODO (Sidebar, Topbar, AppShell)
│   │   ├── dashboard/         ⬜ TODO (StatCard, MemberStatusTable, KpiSnapshot)
│   │   ├── schedule/          ⬜ TODO (WeekCalendarView, ScheduleChip, ExportButton)
│   │   ├── studio/            ⬜ TODO (StudioGrid, StudioCell)
│   │   ├── brand/             ⬜ TODO (KpiCard, BrandContractForm)
│   │   ├── member/            ⬜ TODO (MemberTable, MemberContractForm)
│   │   └── chatbot/           ⬜ TODO (ChatWindow, ChatBubble, SchedulePreview)
│   │
│   ├── lib/
│   │   ├── prisma.ts          ✅ DONE
│   │   ├── google-sheets/
│   │   │   ├── client.ts      ⬜ TODO (Google Auth + Sheets client)
│   │   │   ├── sync.ts        ⬜ TODO (auto-sync jadwal ke Sheets)
│   │   │   └── export.ts      ⬜ TODO (format & write ke Sheets)
│   │   ├── ai/
│   │   │   ├── client.ts      ⬜ TODO (Anthropic client)
│   │   │   ├── generate.ts    ⬜ TODO (logic generate jadwal)
│   │   │   └── prompts.ts     ⬜ TODO (system prompt untuk schedule generator)
│   │   ├── validations/
│   │   │   ├── schedule.ts    ⬜ TODO (Zod schemas)
│   │   │   └── member.ts      ⬜ TODO
│   │   └── utils/
│   │       ├── schedule.ts    ✅ PARTIAL (validateMemberSession, validateStudio)
│   │       ├── date.ts        ⬜ TODO (helpers date-fns)
│   │       └── kpi.ts         ⬜ TODO (hitung KPI status)
│   │
│   ├── hooks/                 ⬜ TODO (useMembers, useSchedules, useBrandKpi, dll)
│   ├── types/index.ts         ✅ DONE
│   ├── constants/index.ts     ✅ DONE
│   └── store/                 ⬜ TODO (Zustand — auth store, filter store)
│
├── CONTEXT.md                 ✅ DONE (file ini)
└── package.json               ✅ DONE
```

---

## Halaman & Fitur (UI)

### 1. Dashboard (`/dashboard`)
- Stat cards: total member, sesi hari ini, member overload, brand at risk
- Tabel status jam member bulan ini (progress bar per member)
- Snapshot KPI brand (progress bar per brand)

### 2. KPI Brand (`/kpi`)
- Stat cards: total brand, on track, at risk
- Grid KPI card per brand — achieved / contracted / remaining / %
- Filter per divisi, per periode

### 3. Generate Jadwal (`/generate`) — FITUR UTAMA
- Chat interface dengan AI
- AI bisa:
  - Generate jadwal semua member untuk 1 minggu
  - Prioritasin brand yang KPI-nya at risk / critical
  - Cek constraint: max jam member, max studio concurrent, studio reserved
  - Deteksi member yang hampir overload
  - Output draft jadwal dalam chat (preview tabel)
  - Setelah di-approve → simpan ke DB + sync ke Google Sheets

### 4. Lihat Jadwal (`/schedule`)
- Calendar view mingguan
- Filter per divisi / brand / member
- Tiap hari tampil chip: member · brand · studio · jam
- Warna chip per sesi (sesi 1 = biru, sesi 2 = hijau, sesi 3 = ungu)
- Warna hari: busy week = kuning, off = abu
- Tombol Export ke Sheets + Regenerate

### 5. Studio Live (`/studios`)
- Grid 10 studio
- Warna: ungu = reserved, hijau = shared, abu = offline
- Status real-time: sedang live / tersedia / offline
- Bisa edit reserved brand per studio

### 6. Master Data
- **Members** (`/master/members`): CRUD member + kontrak jam
- **Admins** (`/master/admins`): CRUD admin + assign divisi
- **Divisi & Brand** (`/master/divisions`): CRUD divisi → brand → kontrak jam brand → studio reserved
- **Kalender Minggu** (`/master/calendar`): input week type (BUSY/NORMAL/LOW) per divisi per minggu

---

## Google Sheets Integration

### Mode 1 — Auto sync
- Setiap kali jadwal di-confirm/approve → otomatis update sheet
- Trigger: `POST /api/sheets/sync`
- Sheet "Jadwal" di-update dengan data terbaru

### Mode 2 — Manual export
- Admin klik "Export ke Sheets" di halaman jadwal
- Trigger: `POST /api/sheets/export`
- Buat/update sheet dengan format yang sudah ditentukan

### Format kolom sheet jadwal
`No | Tanggal | Hari | Member | Brand | Divisi | Studio | Sesi | Jam Mulai | Jam Selesai | Durasi (jam) | Status | Keterangan`

### Auth Google
- Gunakan **Service Account** (bukan OAuth user)
- Simpan credentials di env: `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON stringify)
- Share spreadsheet ke service account email

---

## AI Generate Jadwal — Logic

### Input ke AI
```json
{
  "weekCalendarId": "...",
  "members": [...],         // data member + kontrak + jam terpakai bulan ini
  "brands": [...],          // data brand + KPI saat ini
  "studios": [...],         // data studio + reserved brand
  "weekType": "BUSY",
  "prioritizeKpi": true,
  "overrideDayOff": true    // busy week boleh geser libur
}
```

### Constraint yang harus dicheck AI
1. Member tidak melebihi `max_hours_per_month`
2. Member tidak melebihi `max_hours_per_day` (default 8 jam)
3. Member tidak lebih dari 2 sesi per hari
4. Durasi sesi 2–4 jam
5. Studio reserved tidak boleh dipakai brand lain
6. Max 10 sesi concurrent (studio)
7. Aturan libur (1x atau 2x per minggu, tergantung kontrak)
8. Special case: 3 hari full 8 jam → 4 hari libur

### Output AI
- Draft jadwal (array of schedule objects)
- Warning jika ada constraint hampir terlewat
- KPI impact: berapa jam tambahan per brand
- Studio conflict jika ada

---

## Environment Variables yang Dibutuhkan

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/Schejulo

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Google Sheets (Service Account)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SPREADSHEET_ID=

# Anthropic (AI generate jadwal)
ANTHROPIC_API_KEY=
```

---

## File yang Sudah Ada (DONE)

| File | Status |
|---|---|
| `prisma/schema.prisma` | ✅ Complete — semua model sesuai ERD v3 |
| `src/types/index.ts` | ✅ Complete — semua TypeScript types |
| `src/constants/index.ts` | ✅ Complete — semua business rules & config |
| `src/lib/prisma.ts` | ✅ Complete — Prisma singleton |
| `src/lib/utils/schedule.ts` | ✅ Partial — `validateMemberSession`, `validateStudio` |
| `package.json` | ✅ Complete |

---

## Next Steps (Urutan Rekomendasi)

1. **Setup env & install deps** → `npm install` + buat `.env`
2. **Prisma migrate** → `npx prisma db push` + `npm run db:seed`
3. **Layout & routing** → `app/layout.tsx`, Sidebar, Topbar, AppShell
4. **UI components** → Button, Input, Select, Badge, Modal, Table (base)
5. **Master data CRUD** → mulai dari Members (paling simple, jadi fondasi)
6. **Dashboard** → stat cards + tabel (mostly read-only)
7. **Google Sheets client** → service account setup + sync/export
8. **AI generate jadwal** → system prompt + constraint checker + chat UI
9. **KPI & summary** → auto-recalculate setelah schedule confirmed
10. **Studio live view** → grid + real-time status

---

## Catatan Penting

- **Satu baris `schedules` = satu sesi**, bukan satu hari. Member bisa punya 2 baris di tanggal yang sama (sesi 1 & sesi 2).
- **`week_type` di `week_calendars` bisa per divisi** — Beauty bisa busy week sementara Puma normal di minggu yang sama.
- **Admin "meminjam" member** = admin lain bisa assign member ke jadwal brand mereka. Field `assigned_by_admin_id` di `schedules` bisa berbeda dari `primary_admin_id` di `members`.
- **Studio reserved** = `reserved_brand_id` di tabel `studios`. Null = shared, bisa dipakai siapa aja.
- **KPI dihitung dari sesi yang `status = CONFIRMED`**, bukan DRAFT.
- **Libur busy week bisa digeser** = field `overrideDayOff` saat generate. Ini boleh diabaikan constraint liburnya.
- Format `period_label` selalu `"yyyy-MM"` (contoh: `"2026-03"`).
