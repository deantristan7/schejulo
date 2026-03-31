import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const brand = await prisma.brand.update({
      where: { id: params.id },
      data: parsed.data,
      include: { division: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ data: brand })
  } catch (error) {
    console.error('[PATCH /api/brands/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.brand.update({ where: { id: params.id }, data: { status: 'INACTIVE' } })
    return NextResponse.json({ message: 'Brand dinonaktifkan' })
  } catch (error) {
    console.error('[DELETE /api/brands/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
