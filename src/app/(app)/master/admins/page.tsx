import { prisma } from '@/lib/prisma'
import { AdminsClient } from './admins-client'

async function getData() {
  const [admins, divisions] = await Promise.all([
    prisma.admin.findMany({
      include: {
        divisions: { include: { division: { select: { id: true, name: true } } } },
        _count: { select: { members: true, schedules: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.division.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return { admins, divisions }
}

export default async function AdminsPage() {
  const { admins, divisions } = await getData()
  return <AdminsClient initialAdmins={admins} divisions={divisions} />
}
