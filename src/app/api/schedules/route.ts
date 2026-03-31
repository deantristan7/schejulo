import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weekStart = searchParams.get('weekStart')
    const weekEnd = searchParams.get('weekEnd')
    const divisionId = searchParams.get('divisionId')
    const brandId = searchParams.get('brandId')
    const memberId = searchParams.get('memberId')
    const status = searchParams.get('status')

    if (!weekStart || !weekEnd) {
      return NextResponse.json({ error: 'weekStart dan weekEnd wajib diisi' }, { status: 400 })
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        workDate: {
          gte: new Date(weekStart),
          lte: new Date(weekEnd),
        },
        ...(memberId && { memberId }),
        ...(brandId && { brandId }),
        ...(status && { status: status as 'DRAFT' | 'CONFIRMED' | 'CANCELLED' }),
        ...(divisionId && {
          brand: { divisionId },
        }),
      },
      include: {
        member: { select: { id: true, name: true } },
        brand: {
          select: {
            id: true,
            name: true,
            division: { select: { id: true, name: true } },
          },
        },
        studio: { select: { id: true, name: true, studioNumber: true } },
        assignedByAdmin: { select: { id: true, name: true } },
      },
      orderBy: [{ workDate: 'asc' }, { sessionStart: 'asc' }],
    })

    return NextResponse.json({ data: schedules })
  } catch (error) {
    console.error('[GET /api/schedules]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
