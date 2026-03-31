import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  telegramId: z.string().optional().nullable(),
  primaryAdminId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: {
        primaryAdmin: { select: { id: true, name: true } },
        contracts: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data: member })
  } catch (error) {
    console.error('[GET /api/members/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = updateMemberSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const member = await prisma.member.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        primaryAdmin: { select: { id: true, name: true } },
        contracts: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    return NextResponse.json({ data: member })
  } catch (error) {
    console.error('[PATCH /api/members/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.member.update({
      where: { id: params.id },
      data: { status: 'INACTIVE' },
    })

    return NextResponse.json({ message: 'Member dinonaktifkan' })
  } catch (error) {
    console.error('[DELETE /api/members/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
