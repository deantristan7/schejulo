import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startOfWeek, endOfWeek, format, eachWeekOfInterval, startOfMonth, endOfMonth } from 'date-fns'

const upsertSchema = z.object({
  divisionId: z.string().nullable().optional(),
  periodLabel: z.string().regex(/^\d{4}-\d{2}$/),
  weekStart: z.string(),
  weekEnd: z.string(),
  weekType: z.enum(['BUSY', 'NORMAL', 'LOW']),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const periodLabel = searchParams.get('period') ?? format(new Date(), 'yyyy-MM')
    const divisionId = searchParams.get('divisionId')

    const calendars = await prisma.weekCalendar.findMany({
      where: {
        periodLabel,
        ...(divisionId ? { divisionId } : {}),
      },
      include: { division: { select: { id: true, name: true } } },
      orderBy: { weekStart: 'asc' },
    })

    // Generate all weeks in the month
    const monthStart = new Date(`${periodLabel}-01`)
    const monthEnd = endOfMonth(monthStart)
    const allWeeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    ).map((weekStart) => ({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    }))

    return NextResponse.json({ data: calendars, weeks: allWeeks, periodLabel })
  } catch (error) {
    console.error('[GET /api/week-calendar]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = upsertSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { divisionId, periodLabel, weekStart, weekEnd, weekType, notes } = parsed.data

    const calendar = await prisma.weekCalendar.upsert({
      where: {
        // Upsert by weekStart + divisionId combo
        id: (await prisma.weekCalendar.findFirst({
          where: {
            weekStart: new Date(weekStart),
            divisionId: divisionId ?? null,
          },
          select: { id: true },
        }))?.id ?? 'new',
      },
      update: { weekType, notes },
      create: {
        divisionId: divisionId ?? null,
        periodLabel,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        weekType,
        notes,
      },
    })

    return NextResponse.json({ data: calendar }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/week-calendar]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
