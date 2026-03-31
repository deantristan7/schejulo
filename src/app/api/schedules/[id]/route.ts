import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const schedule = await prisma.schedule.update({
      where: { id: params.id },
      data: parsed.data,
    })

    // Jika di-CONFIRM, update brand KPI
    if (parsed.data.status === 'CONFIRMED') {
      const s = await prisma.schedule.findUnique({
        where: { id: params.id },
        include: { brand: { include: { contracts: true } } },
      })
      if (s) {
        const periodLabel = s.workDate.toISOString().slice(0, 7)
        const contract = s.brand.contracts.find(c => c.periodLabel === periodLabel)
        if (contract) {
          const totalConfirmed = await prisma.schedule.aggregate({
            where: { brandId: s.brandId, status: 'CONFIRMED', workDate: { gte: new Date(`${periodLabel}-01`) } },
            _sum: { sessionHours: true },
          })
          const achieved = totalConfirmed._sum.sessionHours ?? 0
          const pct = (achieved / contract.contractedHours) * 100
          const kpiStatus =
            pct >= 100 ? 'COMPLETED' : pct >= 80 ? 'ON_TRACK' : pct >= 70 ? 'AT_RISK' : 'CRITICAL'

          await prisma.brandKpi.upsert({
            where: { brandId_periodLabel: { brandId: s.brandId, periodLabel } },
            update: { achievedHours: achieved, achievementPct: pct, status: kpiStatus, remainingHours: contract.contractedHours - achieved },
            create: {
              brandId: s.brandId,
              contractId: contract.id,
              periodLabel,
              contractedHours: contract.contractedHours,
              achievedHours: achieved,
              remainingHours: contract.contractedHours - achieved,
              achievementPct: pct,
              status: kpiStatus,
            },
          })
        }
      }
    }

    return NextResponse.json({ data: schedule })
  } catch (error) {
    console.error('[PATCH /api/schedules/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.schedule.update({ where: { id: params.id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ message: 'Sesi dibatalkan' })
  } catch (error) {
    console.error('[DELETE /api/schedules/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
