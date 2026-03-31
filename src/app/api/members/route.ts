import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMemberSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  telegramId: z.string().optional(),
  primaryAdminId: z.string().min(1, 'Admin wajib dipilih'),
  contract: z.object({
    periodLabel: z.string().regex(/^\d{4}-\d{2}$/, 'Format: yyyy-MM'),
    maxHoursPerMonth: z.number().positive(),
    maxHoursPerDay: z.number().default(8),
    maxSessionHours: z.number().default(4),
    minSessionHours: z.number().default(2),
    dayOffPerWeek: z.number().default(2),
    validFrom: z.string(),
    validUntil: z.string(),
  }).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const adminId = searchParams.get('adminId')
    const status = searchParams.get('status')
    const period = searchParams.get('period')

    const members = await prisma.member.findMany({
      where: {
        ...(adminId && { primaryAdminId: adminId }),
        ...(status && { status: status as 'ACTIVE' | 'INACTIVE' }),
      },
      include: {
        primaryAdmin: { select: { id: true, name: true } },
        contracts: period
          ? { where: { periodLabel: period } }
          : { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: members })
  } catch (error) {
    console.error('[GET /api/members]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createMemberSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, telegramId, primaryAdminId, contract } = parsed.data

    const member = await prisma.member.create({
      data: {
        name,
        telegramId,
        primaryAdminId,
        ...(contract && {
          contracts: {
            create: {
              periodLabel: contract.periodLabel,
              maxHoursPerMonth: contract.maxHoursPerMonth,
              maxHoursPerDay: contract.maxHoursPerDay,
              maxSessionHours: contract.maxSessionHours,
              minSessionHours: contract.minSessionHours,
              dayOffPerWeek: contract.dayOffPerWeek,
              validFrom: new Date(contract.validFrom),
              validUntil: new Date(contract.validUntil),
            },
          },
        }),
      },
      include: {
        primaryAdmin: { select: { id: true, name: true } },
        contracts: true,
      },
    })

    return NextResponse.json({ data: member }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/members]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
