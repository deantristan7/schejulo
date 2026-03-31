import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createAdminSchema = z.object({
  name: z.string().min(1),
  telegramId: z.string().optional(),
  divisionIds: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      include: {
        divisions: {
          include: { division: { select: { id: true, name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: admins })
  } catch (error) {
    console.error('[GET /api/admins]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createAdminSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, telegramId, divisionIds } = parsed.data

    const admin = await prisma.admin.create({
      data: {
        name,
        telegramId,
        ...(divisionIds?.length && {
          divisions: {
            create: divisionIds.map((divisionId) => ({ divisionId })),
          },
        }),
      },
      include: {
        divisions: { include: { division: { select: { id: true, name: true } } } },
      },
    })

    return NextResponse.json({ data: admin }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admins]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
