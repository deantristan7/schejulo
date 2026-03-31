import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createBrandSchema = z.object({
  name: z.string().min(1),
  divisionId: z.string().min(1),
  contract: z.object({
    periodLabel: z.string().regex(/^\d{4}-\d{2}$/),
    contractedHours: z.number().positive(),
    validFrom: z.string(),
    validUntil: z.string(),
  }).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const divisionId = searchParams.get('divisionId')
    const period = searchParams.get('period')

    const brands = await prisma.brand.findMany({
      where: {
        status: 'ACTIVE',
        ...(divisionId && { divisionId }),
      },
      include: {
        division: { select: { id: true, name: true } },
        contracts: period
          ? { where: { periodLabel: period } }
          : { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: brands })
  } catch (error) {
    console.error('[GET /api/brands]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createBrandSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, divisionId, contract } = parsed.data

    const brand = await prisma.brand.create({
      data: {
        name,
        divisionId,
        ...(contract && {
          contracts: {
            create: {
              periodLabel: contract.periodLabel,
              contractedHours: contract.contractedHours,
              validFrom: new Date(contract.validFrom),
              validUntil: new Date(contract.validUntil),
            },
          },
        }),
      },
      include: {
        division: { select: { id: true, name: true } },
        contracts: true,
      },
    })

    return NextResponse.json({ data: brand }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/brands]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
