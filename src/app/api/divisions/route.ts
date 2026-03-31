import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createDivisionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const divisions = await prisma.division.findMany({
      include: {
        brands: {
          where: { status: 'ACTIVE' },
          include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
        _count: { select: { brands: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: divisions })
  } catch (error) {
    console.error('[GET /api/divisions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createDivisionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const division = await prisma.division.create({
      data: parsed.data,
    })

    return NextResponse.json({ data: division }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/divisions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
