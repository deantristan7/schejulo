export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { DivisionsClient } from './divisions-client'

async function getData() {
  const divisions = await prisma.division.findMany({
    include: {
      brands: {
        include: {
          contracts: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })
  return { divisions }
}

export default async function DivisionsPage() {
  const { divisions } = await getData()
  return <DivisionsClient initialDivisions={divisions} />
}
