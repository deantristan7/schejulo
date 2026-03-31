import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const periodLabel = searchParams.get('period') ?? format(new Date(), 'yyyy-MM')
    const divisionId = searchParams.get('divisionId')

    const [brandKpis, brands] = await Promise.all([
      prisma.brandKpi.findMany({
        where: {
          periodLabel,
          ...(divisionId && { brand: { divisionId } }),
        },
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              division: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { achievementPct: 'asc' },
      }),
      // brands yang belum ada KPI record bulan ini
      prisma.brand.findMany({
        where: {
          status: 'ACTIVE',
          ...(divisionId && { divisionId }),
          brandKpis: { none: { periodLabel } },
          contracts: { some: { periodLabel } },
        },
        include: {
          division: { select: { id: true, name: true } },
          contracts: { where: { periodLabel }, take: 1 },
        },
      }),
    ])

    // Brands tanpa KPI record: treat sebagai 0% achieved
    const noKpiEntries = brands.map((b) => ({
      id: `no-kpi-${b.id}`,
      brandId: b.id,
      periodLabel,
      contractedHours: b.contracts[0]?.contractedHours ?? 0,
      achievedHours: 0,
      remainingHours: b.contracts[0]?.contractedHours ?? 0,
      achievementPct: 0,
      status: 'CRITICAL' as const,
      brand: { id: b.id, name: b.name, division: b.division },
    }))

    type KpiStatus = 'COMPLETED' | 'ON_TRACK' | 'AT_RISK' | 'CRITICAL'
    const recalcStatus = (pct: number): KpiStatus =>
      pct >= 100 ? 'COMPLETED' : pct >= 80 ? 'ON_TRACK' : pct >= 70 ? 'AT_RISK' : 'CRITICAL'

    const allEntries = [
      ...brandKpis.map((k) => ({ ...k, status: recalcStatus(k.achievementPct) })),
      ...noKpiEntries,
    ]

    const summary = {
      total: allEntries.length,
      completed: allEntries.filter((k) => k.status === 'COMPLETED').length,
      onTrack: allEntries.filter((k) => k.status === 'ON_TRACK').length,
      atRisk: allEntries.filter((k) => k.status === 'AT_RISK').length,
      critical: allEntries.filter((k) => k.status === 'CRITICAL').length,
    }

    return NextResponse.json({ data: allEntries, summary, periodLabel })
  } catch (error) {
    console.error('[GET /api/kpi]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
