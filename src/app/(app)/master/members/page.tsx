import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { MembersClient } from './members-client'

async function getData() {
  const [members, admins] = await Promise.all([
    prisma.member.findMany({
      include: {
        primaryAdmin: { select: { id: true, name: true } },
        contracts: {
          where: { periodLabel: format(new Date(), 'yyyy-MM') },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.admin.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return { members, admins }
}

export default async function MembersPage() {
  const { members, admins } = await getData()
  return <MembersClient initialMembers={members} admins={admins} />
}
