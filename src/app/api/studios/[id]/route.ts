import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStudioSchema = z.object({
  reservedBrandId: z.string().nullable().optional(),
  studioType: z.enum(['RESERVED', 'SHARED']).optional(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'OFFLINE']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = updateStudioSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const studio = await prisma.studio.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        reservedBrand: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: studio })
  } catch (error) {
    console.error('[PATCH /api/studios/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
