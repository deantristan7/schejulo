import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sessionSchema = z.object({
  memberId: z.string(),
  brandId: z.string(),
  studioId: z.string(),
  workDate: z.string(),
  sessionStart: z.string(),
  sessionEnd: z.string(),
  sessionHours: z.number(),
  sessionNumber: z.number(),
})

const bulkSchema = z.object({
  sessions: z.array(sessionSchema).min(1),
  adminId: z.string(),
  weekCalendarId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bulkSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { sessions, adminId, weekCalendarId } = parsed.data

    const created = await prisma.$transaction(
      sessions.map((s) =>
        prisma.schedule.create({
          data: {
            memberId: s.memberId,
            brandId: s.brandId,
            studioId: s.studioId,
            assignedByAdminId: adminId,
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

    return NextResponse.json({ data: created, count: created.length }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/schedules/bulk]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
