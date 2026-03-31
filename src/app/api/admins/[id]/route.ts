import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  telegramId: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  divisionIds: z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { divisionIds, ...data } = parsed.data

    const admin = await prisma.$transaction(async (tx) => {
      if (divisionIds !== undefined) {
        await tx.adminDivision.deleteMany({ where: { adminId: params.id } })
        if (divisionIds.length > 0) {
          await tx.adminDivision.createMany({
            data: divisionIds.map((divisionId) => ({ adminId: params.id, divisionId })),
          })
        }
      }
      return tx.admin.update({
        where: { id: params.id },
        data,
        include: {
          divisions: { include: { division: { select: { id: true, name: true } } } },
        },
      })
    })

    return NextResponse.json({ data: admin })
  } catch (error) {
    console.error('[PATCH /api/admins/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.admin.update({ where: { id: params.id }, data: { status: 'INACTIVE' } })
    return NextResponse.json({ message: 'Admin dinonaktifkan' })
  } catch (error) {
    console.error('[DELETE /api/admins/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
