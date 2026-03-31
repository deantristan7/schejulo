import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PERIOD = '2026-03'
const VALID_FROM = new Date('2026-03-01')
const VALID_UNTIL = new Date('2026-03-31')

async function main() {
  console.log('🌱 Seeding database...')

  // ── Studios ──────────────────────────────────────────────────────────────
  console.log('📺 Creating 10 studios...')
  const studios = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.studio.upsert({
        where: { studioNumber: i + 1 },
        update: {},
        create: {
          name: `Studio ${i + 1}`,
          studioNumber: i + 1,
          studioType: 'SHARED',
          status: 'AVAILABLE',
        },
      })
    )
  )
  console.log(`✅ ${studios.length} studios`)

  // ── Admins ───────────────────────────────────────────────────────────────
  console.log('👤 Creating 3 admins...')
  const adminData = [
    { name: 'Rini Sulistyowati', telegramId: 'admin_beauty_1' },
    { name: 'Agus Hermawan',     telegramId: 'admin_lifestyle_1' },
    { name: 'Nining Rahayu',     telegramId: 'admin_homefood_1' },
  ]
  const [adminBeauty, adminLifestyle, adminHomeFood] = await Promise.all(
    adminData.map((a) =>
      prisma.admin.upsert({
        where: { telegramId: a.telegramId },
        update: {},
        create: { name: a.name, telegramId: a.telegramId, status: 'ACTIVE' },
      })
    )
  )
  console.log('✅ 3 admins')

  // ── Divisions ─────────────────────────────────────────────────────────────
  console.log('🏢 Creating 3 divisions...')
  const [divBeauty, divLifestyle, divHomeFood] = await Promise.all([
    prisma.division.upsert({
      where: { name: 'Beauty' },
      update: {},
      create: { name: 'Beauty', description: 'Beauty & Skincare brands' },
    }),
    prisma.division.upsert({
      where: { name: 'Lifestyle' },
      update: {},
      create: { name: 'Lifestyle', description: 'Puma, TP-Link, Realme' },
    }),
    prisma.division.upsert({
      where: { name: 'Home & Food' },
      update: {},
      create: { name: 'Home & Food', description: 'Lock & Lock, Oatside' },
    }),
  ])
  console.log('✅ 3 divisions')

  // ── Admin-Division links ──────────────────────────────────────────────────
  await Promise.all([
    prisma.adminDivision.upsert({
      where: { adminId_divisionId: { adminId: adminBeauty.id, divisionId: divBeauty.id } },
      update: {},
      create: { adminId: adminBeauty.id, divisionId: divBeauty.id },
    }),
    prisma.adminDivision.upsert({
      where: { adminId_divisionId: { adminId: adminLifestyle.id, divisionId: divLifestyle.id } },
      update: {},
      create: { adminId: adminLifestyle.id, divisionId: divLifestyle.id },
    }),
    prisma.adminDivision.upsert({
      where: { adminId_divisionId: { adminId: adminHomeFood.id, divisionId: divHomeFood.id } },
      update: {},
      create: { adminId: adminHomeFood.id, divisionId: divHomeFood.id },
    }),
  ])

  // ── Brands (15 total) ─────────────────────────────────────────────────────
  // Beauty: 10 brands | Lifestyle: 3 brands | Home & Food: 2 brands
  console.log('🏷️  Creating 15 brands...')

  // preferredStartHour = jam mulai live (0–23)
  // Beauty → sore/malam (19:00), Lifestyle → pagi (09:00), Home & Food → siang (13:00)
  const beautyBrands = [
    { id: 'brand_somethinc',    name: 'Somethinc',      hours: 280, startHour: 19 },
    { id: 'brand_skintific',    name: 'Skintific',      hours: 260, startHour: 19 },
    { id: 'brand_wardah',       name: 'Wardah',         hours: 300, startHour: 15 },
    { id: 'brand_implora',      name: 'Implora',        hours: 150, startHour: 19 },
    { id: 'brand_msglow',       name: 'Ms Glow',        hours: 200, startHour: 20 },
    { id: 'brand_dearme',       name: 'Dear Me Beauty', hours: 180, startHour: 19 },
    { id: 'brand_base',         name: 'Base',           hours: 120, startHour: 15 },
    { id: 'brand_avoskin',      name: 'Avoskin',        hours: 220, startHour: 19 },
    { id: 'brand_you',          name: 'Y.O.U',          hours: 170, startHour: 15 },
    { id: 'brand_npure',        name: 'NPURE',          hours: 140, startHour: 19 },
  ]
  const lifestyleBrands = [
    { id: 'brand_puma',         name: 'Puma',           hours: 250, startHour:  9 },
    { id: 'brand_tplink',       name: 'TP-Link',        hours: 200, startHour: 10 },
    { id: 'brand_realme',       name: 'Realme',         hours: 230, startHour:  9 },
  ]
  const homeFoodBrands = [
    { id: 'brand_locknlock',    name: 'Lock & Lock',    hours: 180, startHour: 13 },
    { id: 'brand_oatside',      name: 'Oatside',        hours: 100, startHour: 10 },
  ]

  const allBrandDefs = [
    ...beautyBrands.map((b) => ({ ...b, divisionId: divBeauty.id })),
    ...lifestyleBrands.map((b) => ({ ...b, divisionId: divLifestyle.id })),
    ...homeFoodBrands.map((b) => ({ ...b, divisionId: divHomeFood.id })),
  ]

  const brandRecords = await Promise.all(
    allBrandDefs.map((b) =>
      prisma.brand.upsert({
        where: { id: b.id },
        update: { preferredStartHour: b.startHour },
        create: { id: b.id, name: b.name, divisionId: b.divisionId, preferredStartHour: b.startHour, status: 'ACTIVE' },
      })
    )
  )
  console.log(`✅ ${brandRecords.length} brands`)

  // ── Brand Contracts ───────────────────────────────────────────────────────
  console.log('📋 Creating brand contracts...')
  const brandContracts = await Promise.all(
    allBrandDefs.map((b) =>
      prisma.brandContract.upsert({
        where: { brandId_periodLabel: { brandId: b.id, periodLabel: PERIOD } },
        update: {},
        create: {
          brandId:         b.id,
          periodLabel:     PERIOD,
          contractedHours: b.hours,
          validFrom:       VALID_FROM,
          validUntil:      VALID_UNTIL,
        },
      })
    )
  )
  console.log(`✅ ${brandContracts.length} brand contracts`)

  // ── Brand KPIs (initial, 0 achieved) ─────────────────────────────────────
  await Promise.all(
    allBrandDefs.map((b, i) =>
      prisma.brandKpi.upsert({
        where: { brandId_periodLabel: { brandId: b.id, periodLabel: PERIOD } },
        update: {},
        create: {
          brandId:         b.id,
          contractId:      brandContracts[i].id,
          periodLabel:     PERIOD,
          contractedHours: b.hours,
          achievedHours:   0,
          remainingHours:  b.hours,
          achievementPct:  0,
          status:          'ON_TRACK',
        },
      })
    )
  )

  // ── Members (30 total) ────────────────────────────────────────────────────
  // 10 per admin | max hours mix: 160–200 (dayOff=1) or 100–140 (dayOff=2)
  console.log('👥 Creating 30 members...')

  const memberData: { name: string; tgId: string; adminId: string; maxHours: number }[] = [
    // Beauty (admin 1) — 10 members
    { name: 'Andi Wijaya',      tgId: 'member_01', adminId: adminBeauty.id,    maxHours: 200 },
    { name: 'Budi Santoso',     tgId: 'member_02', adminId: adminBeauty.id,    maxHours: 180 },
    { name: 'Citra Dewi',       tgId: 'member_03', adminId: adminBeauty.id,    maxHours: 160 },
    { name: 'Dian Permata',     tgId: 'member_04', adminId: adminBeauty.id,    maxHours: 140 },
    { name: 'Eko Prasetyo',     tgId: 'member_05', adminId: adminBeauty.id,    maxHours: 120 },
    { name: 'Fitri Handayani',  tgId: 'member_06', adminId: adminBeauty.id,    maxHours: 200 },
    { name: 'Gilang Ramadhan',  tgId: 'member_07', adminId: adminBeauty.id,    maxHours: 160 },
    { name: 'Hani Safitri',     tgId: 'member_08', adminId: adminBeauty.id,    maxHours: 100 },
    { name: 'Irfan Maulana',    tgId: 'member_09', adminId: adminBeauty.id,    maxHours: 180 },
    { name: 'Jasmine Putri',    tgId: 'member_10', adminId: adminBeauty.id,    maxHours: 120 },
    // Lifestyle (admin 2) — 10 members
    { name: 'Kevin Kurniawan',  tgId: 'member_11', adminId: adminLifestyle.id, maxHours: 200 },
    { name: 'Laras Setiawati',  tgId: 'member_12', adminId: adminLifestyle.id, maxHours: 160 },
    { name: 'Mira Anggraeni',   tgId: 'member_13', adminId: adminLifestyle.id, maxHours: 140 },
    { name: 'Nabil Fauzi',      tgId: 'member_14', adminId: adminLifestyle.id, maxHours: 180 },
    { name: 'Olivia Susanto',   tgId: 'member_15', adminId: adminLifestyle.id, maxHours: 120 },
    { name: 'Putra Nugroho',    tgId: 'member_16', adminId: adminLifestyle.id, maxHours: 160 },
    { name: 'Qori Amalia',      tgId: 'member_17', adminId: adminLifestyle.id, maxHours: 100 },
    { name: 'Reza Firmansyah',  tgId: 'member_18', adminId: adminLifestyle.id, maxHours: 200 },
    { name: 'Siti Rahayu',      tgId: 'member_19', adminId: adminLifestyle.id, maxHours: 160 },
    { name: 'Taufik Hidayat',   tgId: 'member_20', adminId: adminLifestyle.id, maxHours: 120 },
    // Home & Food (admin 3) — 10 members
    { name: 'Ulfa Nurhaliza',   tgId: 'member_21', adminId: adminHomeFood.id,  maxHours: 180 },
    { name: 'Vino Pratama',     tgId: 'member_22', adminId: adminHomeFood.id,  maxHours: 160 },
    { name: 'Winda Astuti',     tgId: 'member_23', adminId: adminHomeFood.id,  maxHours: 140 },
    { name: 'Xavier Tanoto',    tgId: 'member_24', adminId: adminHomeFood.id,  maxHours: 100 },
    { name: 'Yuni Pratiwi',     tgId: 'member_25', adminId: adminHomeFood.id,  maxHours: 200 },
    { name: 'Zaki Akbar',       tgId: 'member_26', adminId: adminHomeFood.id,  maxHours: 160 },
    { name: 'Ayu Lestari',      tgId: 'member_27', adminId: adminHomeFood.id,  maxHours: 120 },
    { name: 'Bayu Wicaksono',   tgId: 'member_28', adminId: adminHomeFood.id,  maxHours: 180 },
    { name: 'Cici Maharani',    tgId: 'member_29', adminId: adminHomeFood.id,  maxHours: 160 },
    { name: 'Dendi Saputra',    tgId: 'member_30', adminId: adminHomeFood.id,  maxHours: 140 },
  ]

  const members = await Promise.all(
    memberData.map((m) =>
      prisma.member.upsert({
        where: { telegramId: m.tgId },
        update: {},
        create: {
          name:           m.name,
          telegramId:     m.tgId,
          primaryAdminId: m.adminId,
          status:         'ACTIVE',
        },
      })
    )
  )
  console.log(`✅ ${members.length} members`)

  // ── Member Contracts ──────────────────────────────────────────────────────
  console.log('📋 Creating member contracts...')
  await Promise.all(
    memberData.map((m, i) => {
      const dayOff = m.maxHours >= 160 ? 1 : 2
      return prisma.memberContract.upsert({
        where: { memberId_periodLabel: { memberId: members[i].id, periodLabel: PERIOD } },
        update: {},
        create: {
          memberId:          members[i].id,
          periodLabel:       PERIOD,
          maxHoursPerMonth:  m.maxHours,
          maxHoursPerDay:    8,
          maxSessionHours:   4,
          minSessionHours:   2,
          dayOffPerWeek:     dayOff,
          validFrom:         VALID_FROM,
          validUntil:        VALID_UNTIL,
        },
      })
    })
  )
  console.log('✅ 30 member contracts')

  // ── Week Calendars (March 2026) ───────────────────────────────────────────
  // Payday = ~25 Mar (week 4) → BUSY
  // Twindate = 3/3 (week 1) → BUSY
  // Week 2 → NORMAL, Week 3 → LOW
  console.log('📅 Creating week calendars...')

  const weekDefs = [
    { start: '2026-03-02', end: '2026-03-08', type: 'BUSY',   note: '3.3 Twindate Sale' },
    { start: '2026-03-09', end: '2026-03-15', type: 'NORMAL', note: null },
    { start: '2026-03-16', end: '2026-03-22', type: 'LOW',    note: null },
    { start: '2026-03-23', end: '2026-03-29', type: 'BUSY',   note: 'Payday Week' },
  ] as const

  const weekCalendars = await Promise.all(
    weekDefs.map((w) =>
      prisma.weekCalendar.upsert({
        where: {
          // No unique constraint on weekStart, so use findFirst + create pattern via upsert by constructed id
          // Prisma doesn't have unique on weekStart; we'll upsert by id using a deterministic id
          id: `wc_${PERIOD}_${w.start}`,
        },
        update: {},
        create: {
          id:          `wc_${PERIOD}_${w.start}`,
          divisionId:  null, // berlaku semua divisi
          periodLabel: PERIOD,
          weekStart:   new Date(w.start),
          weekEnd:     new Date(w.end),
          weekType:    w.type,
          notes:       w.note ?? undefined,
        },
      })
    )
  )
  console.log(`✅ ${weekCalendars.length} week calendars`)

  console.log('\n🎉 Seeding complete!')
  console.log(`   - 10 studios`)
  console.log(`   - 3 admins`)
  console.log(`   - 3 divisions`)
  console.log(`   - 15 brands + 15 contracts + 15 KPI records`)
  console.log(`   - 30 members + 30 contracts`)
  console.log(`   - 4 week calendars (March 2026)`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
