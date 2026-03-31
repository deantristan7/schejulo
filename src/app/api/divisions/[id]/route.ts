import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const division = await prisma.division.update({
      where: { id: params.id },
      data: parsed.data,
    })
    return NextResponse.json({ data: division })
  } catch (error) {
    console.error('[PATCH /api/divisions/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.division.update({ where: { id: params.id }, data: { status: 'INACTIVE' } })
    return NextResponse.json({ message: 'Divisi dinonaktifkan' })
  } catch (error) {
    console.error('[DELETE /api/divisions/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
