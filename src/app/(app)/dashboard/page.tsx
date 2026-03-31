import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Users, CalendarCheck, AlertTriangle, TrendingDown } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getDashboardData() {
  const today = new Date()
  const periodLabel = format(today, 'yyyy-MM')

  const [totalMembers, totalBrands, sessionsToday, brandKpis, memberSummaries] =
    await Promise.all([
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.brand.count({ where: { status: 'ACTIVE' } }),
      prisma.schedule.count({
        where: {
          workDate: new Date(format(today, 'yyyy-MM-dd')),
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.brandKpi.findMany({
        where: { periodLabel },
        include: { brand: { select: { name: true, division: { select: { name: true } } } } },
        orderBy: { achievementPct: 'asc' },
      }),
      prisma.monthlySummary.findMany({
        where: { periodLabel },
        include: { member: { select: { name: true } } },
        orderBy: { hoursRemaining: 'asc' },
      }),
    ])

  type KpiStatus = 'COMPLETED' | 'ON_TRACK' | 'AT_RISK' | 'CRITICAL'
  const recalcStatus = (pct: number): KpiStatus =>
    pct >= 100 ? 'COMPLETED' : pct >= 80 ? 'ON_TRACK' : pct >= 70 ? 'AT_RISK' : 'CRITICAL'

  const brandKpisRecalc = brandKpis.map(k => ({ ...k, status: recalcStatus(k.achievementPct) }))
  const brandsAtRisk = brandKpisRecalc.filter(k => k.status === 'AT_RISK' || k.status === 'CRITICAL').length
  const membersOverload = memberSummaries.filter(s => s.hoursRemaining <= 0).length

  return { totalMembers, totalBrands, sessionsToday, brandsAtRisk, membersOverload, brandKpis: brandKpisRecalc, memberSummaries, periodLabel }
}

const kpiVariant: Record<string, 'completed' | 'on_track' | 'at_risk' | 'critical'> = {
  COMPLETED: 'completed', ON_TRACK: 'on_track', AT_RISK: 'at_risk', CRITICAL: 'critical',
}
const kpiLabel: Record<string, string> = {
  COMPLETED: 'Completed', ON_TRACK: 'On Track', AT_RISK: 'At Risk', CRITICAL: 'Critical',
}
const barColor: Record<string, string> = {
  COMPLETED: 'bg-green-500', ON_TRACK: 'bg-blue-500', AT_RISK: 'bg-yellow-400', CRITICAL: 'bg-red-500',
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  const monthLabel = format(new Date(), 'MMMM yyyy', { locale: localeId })

  const kpiDistribution = {
    COMPLETED: data.brandKpis.filter(k => k.status === 'COMPLETED').length,
    ON_TRACK: data.brandKpis.filter(k => k.status === 'ON_TRACK').length,
    AT_RISK: data.brandKpis.filter(k => k.status === 'AT_RISK').length,
    CRITICAL: data.brandKpis.filter(k => k.status === 'CRITICAL').length,
  }
  const totalKpi = data.brandKpis.length

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500">Periode {monthLabel}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Member" value={data.totalMembers} subtitle="Live host aktif" icon={Users} iconColor="text-indigo-600" />
        <StatCard title="Sesi Hari Ini" value={data.sessionsToday} subtitle={format(new Date(), 'dd MMM yyyy', { locale: localeId })} icon={CalendarCheck} iconColor="text-green-600" />
        <StatCard title="Member Overload" value={data.membersOverload} subtitle="Jam habis bulan ini" icon={AlertTriangle} iconColor={data.membersOverload > 0 ? 'text-red-500' : 'text-gray-400'} />
        <StatCard title="Brand At Risk" value={data.brandsAtRisk} subtitle="KPI di bawah 80%" icon={TrendingDown} iconColor={data.brandsAtRisk > 0 ? 'text-yellow-500' : 'text-gray-400'} />
      </div>

      {/* KPI Distribution Bar */}
      {totalKpi > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Distribusi KPI Brand</CardTitle>
              <span className="text-xs text-gray-400">{totalKpi} brand · {monthLabel}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 gap-0.5">
              {(['COMPLETED', 'ON_TRACK', 'AT_RISK', 'CRITICAL'] as const).map(status => {
                const count = kpiDistribution[status]
                if (!count) return null
                const pct = (count / totalKpi) * 100
                return (
                  <div
                    key={status}
                    className={`${barColor[status]} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${kpiLabel[status]}: ${count}`}
                  />
                )
              })}
            </div>
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              {(['COMPLETED', 'ON_TRACK', 'AT_RISK', 'CRITICAL'] as const).map(status => {
                const count = kpiDistribution[status]
                if (!count) return null
                return (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${barColor[status]}`} />
                    <span className="text-xs text-gray-600">{kpiLabel[status]} <span className="font-semibold text-gray-900">({count})</span></span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Member Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Status Jam Member</CardTitle>
              {data.membersOverload > 0 && (
                <Badge variant="critical">{data.membersOverload} overload</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.memberSummaries.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">Belum ada data bulan ini</p>
                <p className="text-xs text-gray-400 mt-1">Generate & konfirmasi jadwal untuk melihat data ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.memberSummaries.slice(0, 8).map(s => {
                  const pct = Math.min((s.totalHoursUsed / s.maxHoursContract) * 100, 100)
                  const isOver = s.hoursRemaining <= 0
                  const isWarning = pct >= 80
                  return (
                    <div key={s.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{s.member.name}</span>
                        <div className="flex items-center gap-2">
                          {isOver && <Badge variant="critical">Overload</Badge>}
                          <span className="text-gray-500 tabular-nums">
                            {s.totalHoursUsed}<span className="text-gray-400">/{s.maxHoursContract}h</span>
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className={`h-1.5 rounded-full transition-all ${isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-400' : 'bg-indigo-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI Brand Snapshot */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>KPI Brand</CardTitle>
              {data.brandsAtRisk > 0 && (
                <Badge variant="at_risk">{data.brandsAtRisk} at risk</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.brandKpis.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">Belum ada data KPI bulan ini</p>
                <p className="text-xs text-gray-400 mt-1">Set kontrak jam brand, lalu konfirmasi sesi live</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.brandKpis.slice(0, 8).map(k => (
                  <div key={k.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium text-gray-700 truncate">{k.brand.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{k.brand.division.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-gray-500 tabular-nums text-xs">{k.achievedHours}/{k.contractedHours}h</span>
                        <Badge variant={kpiVariant[k.status]}>{kpiLabel[k.status]}</Badge>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full transition-all ${barColor[k.status]}`}
                        style={{ width: `${Math.min(k.achievementPct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
