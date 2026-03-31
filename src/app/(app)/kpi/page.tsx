'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, BarChart3, TrendingUp, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'

type KpiEntry = {
  id: string
  brandId: string
  periodLabel: string
  contractedHours: number
  achievedHours: number
  remainingHours: number
  achievementPct: number
  status: 'COMPLETED' | 'ON_TRACK' | 'AT_RISK' | 'CRITICAL'
  brand: {
    id: string
    name: string
    division: { id: string; name: string }
  }
}

type Summary = {
  total: number
  completed: number
  onTrack: number
  atRisk: number
  critical: number
}

const STATUS_CONFIG = {
  COMPLETED: {
    label: 'Completed',
    variant: 'completed' as const,
    bar: 'bg-green-500',
    ring: 'ring-green-200',
    bg: 'bg-green-50',
  },
  ON_TRACK: {
    label: 'On Track',
    variant: 'on_track' as const,
    bar: 'bg-blue-500',
    ring: 'ring-blue-200',
    bg: 'bg-blue-50',
  },
  AT_RISK: {
    label: 'At Risk',
    variant: 'at_risk' as const,
    bar: 'bg-yellow-400',
    ring: 'ring-yellow-200',
    bg: 'bg-yellow-50',
  },
  CRITICAL: {
    label: 'Critical',
    variant: 'critical' as const,
    bar: 'bg-red-500',
    ring: 'ring-red-200',
    bg: 'bg-red-50',
  },
}

export default function KpiPage() {
  const [currentPeriod, setCurrentPeriod] = useState(new Date())
  const [entries, setEntries] = useState<KpiEntry[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [divisions, setDivisions] = useState<{ id: string; name: string }[]>([])
  const [divisionId, setDivisionId] = useState('')
  const [loading, setLoading] = useState(false)

  const periodLabel = format(currentPeriod, 'yyyy-MM')

  const fetchKpi = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period: periodLabel, ...(divisionId && { divisionId }) })
      const res = await fetch(`/api/kpi?${params}`)
      const json = await res.json()
      setEntries(json.data ?? [])
      setSummary(json.summary ?? null)
    } finally {
      setLoading(false)
    }
  }, [periodLabel, divisionId])

  useEffect(() => { fetchKpi() }, [fetchKpi])

  useEffect(() => {
    fetch('/api/divisions').then(r => r.json()).then(json => setDivisions(json.data ?? []))
  }, [])

  // Group by division
  const byDivision = entries.reduce<Record<string, { divName: string; entries: KpiEntry[] }>>((acc, e) => {
    const divId = e.brand.division.id
    if (!acc[divId]) acc[divId] = { divName: e.brand.division.name, entries: [] }
    acc[divId].entries.push(e)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">KPI Brand</h2>
          <p className="text-sm text-gray-500">
            {format(currentPeriod, 'MMMM yyyy', { locale: localeId })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Division filter */}
          <select
            value={divisionId}
            onChange={e => setDivisionId(e.target.value)}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Semua Divisi</option>
            {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          {/* Period nav */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setCurrentPeriod(p => subMonths(p, 1))}
              className="p-2 hover:bg-gray-50 rounded-l-lg"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentPeriod(new Date())}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 border-x border-gray-200"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setCurrentPeriod(p => addMonths(p, 1))}
              className="p-2 hover:bg-gray-50 rounded-r-lg"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Brand" value={summary.total} icon={BarChart3} iconColor="text-indigo-600" />
          <StatCard
            title="Completed"
            value={summary.completed}
            subtitle="≥ 100%"
            icon={CheckCircle2}
            iconColor="text-green-600"
          />
          <StatCard
            title="On Track"
            value={summary.onTrack}
            subtitle="≥ 80%"
            icon={TrendingUp}
            iconColor="text-blue-600"
          />
          <StatCard
            title="At Risk / Critical"
            value={summary.atRisk + summary.critical}
            subtitle="< 80%"
            icon={AlertTriangle}
            iconColor={(summary.atRisk + summary.critical) > 0 ? 'text-red-500' : 'text-gray-400'}
          />
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Memuat data KPI...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <XCircle className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">Belum ada data KPI untuk {periodLabel}</p>
          <p className="text-xs text-gray-400 mt-1">Tambah brand + kontrak jam, lalu generate & konfirmasi sesi</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byDivision).map(([divId, { divName, entries: divEntries }]) => (
            <div key={divId}>
              {/* Division label */}
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{divName}</h3>
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400">{divEntries.length} brand</span>
              </div>

              {/* Brand KPI grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {divEntries.map((entry) => {
                  const cfg = STATUS_CONFIG[entry.status]
                  const pct = Math.min(entry.achievementPct, 100)

                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        'rounded-xl border bg-white p-4 shadow-sm ring-1',
                        cfg.ring
                      )}
                    >
                      {/* Brand name + badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h4 className="font-semibold text-gray-900 leading-tight">{entry.brand.name}</h4>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{entry.achievedHours} jam tercapai</span>
                          <span className="font-semibold text-gray-800">{entry.achievementPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className={cn('h-2 rounded-full transition-all', cfg.bar)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Detail numbers */}
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div className={cn('rounded-lg py-2', cfg.bg)}>
                          <p className="text-[11px] text-gray-500">Target</p>
                          <p className="text-sm font-bold text-gray-800">{entry.contractedHours}h</p>
                        </div>
                        <div className={cn('rounded-lg py-2', cfg.bg)}>
                          <p className="text-[11px] text-gray-500">Tercapai</p>
                          <p className="text-sm font-bold text-gray-800">{entry.achievedHours}h</p>
                        </div>
                        <div className={cn('rounded-lg py-2', cfg.bg)}>
                          <p className="text-[11px] text-gray-500">Sisa</p>
                          <p className={cn('text-sm font-bold', entry.remainingHours <= 0 ? 'text-green-600' : 'text-gray-800')}>
                            {entry.remainingHours <= 0 ? '✓' : `${entry.remainingHours}h`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
