import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const studios = await prisma.studio.findMany({
      include: {
        reservedBrand: { select: { id: true, name: true, division: { select: { name: true } } } },
      },
      orderBy: { studioNumber: 'asc' },
    })

    return NextResponse.json({ data: studios })
  } catch (error) {
    console.error('[GET /api/studios]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
