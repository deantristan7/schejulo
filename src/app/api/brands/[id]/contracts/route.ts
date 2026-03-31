import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createContractSchema = z.object({
  periodLabel: z.string().regex(/^\d{4}-\d{2}$/),
  contractedHours: z.number().positive(),
  validFrom: z.string(),
  validUntil: z.string(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = createContractSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const contract = await prisma.brandContract.upsert({
      where: { brandId_periodLabel: { brandId: params.id, periodLabel: parsed.data.periodLabel } },
      update: { contractedHours: parsed.data.contractedHours },
      create: {
        brandId: params.id,
        periodLabel: parsed.data.periodLabel,
        contractedHours: parsed.data.contractedHours,
        validFrom: new Date(parsed.data.validFrom),
        validUntil: new Date(parsed.data.validUntil),
      },
    })
    return NextResponse.json({ data: contract }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/brands/:id/contracts]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
