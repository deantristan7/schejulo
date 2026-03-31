import { prisma } from '@/lib/prisma'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { aiProvider } from './client'
import { buildSystemPrompt, buildGeneratePrompt } from './prompts'
import type { GenerateScheduleInput, GenerateScheduleOutput, AIMessage } from './types'

// ─────────────────────────────────────────
// Fetch semua konteks yang dibutuhkan AI
// ─────────────────────────────────────────

export async function buildGenerateContext(
  weekDate: Date,
  periodLabel: string
): Promise<GenerateScheduleInput> {
  const weekStart = format(startOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [members, brands, studios, weekCalendar] = await Promise.all([
    prisma.member.findMany({
      where: { status: 'ACTIVE' },
      include: {
        contracts: { where: { periodLabel }, take: 1 },
        schedules: {
          where: {
            status: 'CONFIRMED',
            workDate: {
              gte: new Date(`${periodLabel}-01`),
              lte: new Date(weekEnd),
            },
          },
          select: { sessionHours: true },
        },
      },
    }),
    prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      include: {
        division: { select: { name: true } },
        contracts: { where: { periodLabel }, take: 1 },
        brandKpis: { where: { periodLabel }, take: 1 },
        studios: { select: { id: true } },
      },
    }),
    prisma.studio.findMany({
      orderBy: { studioNumber: 'asc' },
      include: { reservedBrand: { select: { name: true } } },
    }),
    prisma.weekCalendar.findFirst({
      where: {
        periodLabel,
        weekStart: { lte: new Date(weekStart) },
        weekEnd: { gte: new Date(weekEnd) },
      },
    }),
  ])

  const memberContexts = members
    .filter((m) => m.contracts.length > 0)
    .map((m) => {
      const contract = m.contracts[0]
      const usedHours = m.schedules.reduce((sum, s) => sum + s.sessionHours, 0)
      return {
        id: m.id,
        name: m.name,
        maxHoursPerMonth: contract.maxHoursPerMonth,
        maxHoursPerDay: contract.maxHoursPerDay,
        maxSessionHours: contract.maxSessionHours,
        minSessionHours: contract.minSessionHours,
        dayOffPerWeek: contract.dayOffPerWeek,
        usedHoursThisMonth: usedHours,
        remainingHours: contract.maxHoursPerMonth - usedHours,
      }
    })

  const brandContexts = brands
    .filter((b) => b.contracts.length > 0)
    .map((b) => {
      const contract = b.contracts[0]
      const kpi = b.brandKpis[0]
      const achievedHours = kpi?.achievedHours ?? 0
      const contractedHours = contract.contractedHours
      return {
        id: b.id,
        name: b.name,
        division: b.division.name,
        contractedHours,
        achievedHours,
        remainingHours: contractedHours - achievedHours,
        achievementPct: contractedHours > 0 ? Math.round((achievedHours / contractedHours) * 100) : 0,
        kpiStatus: kpi?.status ?? 'ON_TRACK',
        preferredStartHour: b.preferredStartHour,
        reservedStudioIds: b.studios.map((s) => s.id),
      }
    })

  const studioContexts = studios.map((s) => ({
    id: s.id,
    name: s.name,
    studioNumber: s.studioNumber,
    studioType: s.studioType,
    reservedBrandId: s.reservedBrandId,
    reservedBrandName: s.reservedBrand?.name ?? null,
  }))

  return {
    weekStart,
    weekEnd,
    weekType: (weekCalendar?.weekType ?? 'NORMAL') as 'BUSY' | 'NORMAL' | 'LOW',
    periodLabel,
    members: memberContexts,
    brands: brandContexts,
    studios: studioContexts,
  }
}

// ─────────────────────────────────────────
// Main generate function
// ─────────────────────────────────────────

export async function generateSchedule(
  input: GenerateScheduleInput,
  history: AIMessage[] = []
): Promise<GenerateScheduleOutput> {
  const provider = aiProvider()
  const systemPrompt = buildSystemPrompt()
  const userMessage = buildGeneratePrompt(input)

  const messages: AIMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  const raw = await provider.chat({ messages, systemPrompt })

  // Parse JSON — strip markdown fences if any
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  const output: GenerateScheduleOutput = JSON.parse(cleaned)

  return output
}

// ─────────────────────────────────────────
// Save draft schedules to DB
// ─────────────────────────────────────────

export async function saveDraftSchedules(
  sessions: GenerateScheduleOutput['sessions'],
  assignedByAdminId: string,
  weekCalendarId?: string
) {
  const created = await prisma.$transaction(
    sessions.map((s) =>
      prisma.schedule.create({
        data: {
          memberId: s.memberId,
          brandId: s.brandId,
          studioId: s.studioId,
          assignedByAdminId,
          weekCalendarId: weekCalendarId ?? null,
          workDate: new Date(s.workDate),
          sessionStart: s.sessionStart,
          sessionEnd: s.sessionEnd,
          sessionHours: s.sessionHours,
          sessionNumber: s.sessionNumber,
          status: 'DRAFT',
        },
      })
    )
  )
  return created
}
