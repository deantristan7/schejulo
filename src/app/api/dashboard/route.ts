import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET() {
  try {
    const today = new Date()
    const periodLabel = format(today, 'yyyy-MM')
    const todayDate = format(today, 'yyyy-MM-dd')

    const [
      totalMembers,
      totalBrands,
      sessionsToday,
      brandKpis,
      memberSummaries,
    ] = await Promise.all([
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.brand.count({ where: { status: 'ACTIVE' } }),
      prisma.schedule.count({
        where: {
          workDate: new Date(todayDate),
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.brandKpi.findMany({
        where: { periodLabel },
        include: { brand: { select: { name: true } } },
      }),
      prisma.monthlySummary.findMany({
        where: { periodLabel },
        include: { member: { select: { name: true } } },
      }),
    ])

    const brandsAtRisk = brandKpis.filter(
      (k) => k.status === 'AT_RISK' || k.status === 'CRITICAL'
    ).length

    const membersOverload = memberSummaries.filter(
      (s) => s.hoursRemaining <= 0
    ).length

    return NextResponse.json({
      totalMembers,
      totalBrands,
      sessionsToday,
      brandsAtRisk,
      membersOverload,
      brandKpis,
      memberSummaries,
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
