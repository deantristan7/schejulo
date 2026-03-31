export const dynamic = 'force-dynamic'

'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addMonths, subMonths } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'

type WeekCalendar = {
  id: string
  weekStart: string
  weekEnd: string
  weekType: 'BUSY' | 'NORMAL' | 'LOW'
  divisionId: string | null
  notes: string | null
  division: { id: string; name: string } | null
}

type WeekSlot = { weekStart: string; weekEnd: string }

const WEEK_TYPE_CONFIG = {
  BUSY: { label: 'Busy', bg: 'bg-yellow-100 border-yellow-400 text-yellow-800', dot: 'bg-yellow-400' },
  NORMAL: { label: 'Normal', bg: 'bg-blue-50 border-blue-300 text-blue-800', dot: 'bg-blue-400' },
  LOW: { label: 'Low', bg: 'bg-gray-100 border-gray-300 text-gray-600', dot: 'bg-gray-400' },
} as const

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendars, setCalendars] = useState<WeekCalendar[]>([])
  const [weeks, setWeeks] = useState<WeekSlot[]>([])
  const [divisions, setDivisions] = useState<{ id: string; name: string }[]>([])
  const [selectedDivisionId, setSelectedDivisionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const periodLabel = format(currentMonth, 'yyyy-MM')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period: periodLabel, ...(selectedDivisionId && { divisionId: selectedDivisionId }) })
      const res = await fetch(`/api/week-calendar?${params}`)
      const json = await res.json()
      setCalendars(json.data ?? [])
      setWeeks(json.weeks ?? [])
    } finally {
      setLoading(false)
    }
  }, [periodLabel, selectedDivisionId])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    fetch('/api/divisions').then(r => r.json()).then(json => setDivisions(json.data ?? []))
  }, [])

  function getCalendarForWeek(weekStart: string): WeekCalendar | undefined {
    return calendars.find(c => {
      const cs = new Date(c.weekStart).toISOString().slice(0, 10)
      return cs === weekStart && c.divisionId === (selectedDivisionId || null)
    })
  }

  async function setWeekType(week: WeekSlot, weekType: 'BUSY' | 'NORMAL' | 'LOW') {
    const key = `${week.weekStart}-${selectedDivisionId}`
    setSaving(key)
    try {
      const res = await fetch('/api/week-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          divisionId: selectedDivisionId || null,
          periodLabel,
          weekStart: week.weekStart,
          weekEnd: week.weekEnd,
          weekType,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Minggu ${week.weekStart} → ${weekType}`)
      fetchData()
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Kalender Minggu</h2>
          <p className="text-sm text-gray-500">Set tipe minggu (Busy / Normal / Low) per divisi</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedDivisionId}
            onChange={e => setSelectedDivisionId(e.target.value)}
            className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Semua Divisi (Global)</option>
            {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="flex items-center rounded-lg border border-gray-200 bg-white">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 hover:bg-gray-50 rounded-l-lg">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 border-x border-gray-200">
              Bulan Ini
            </button>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-gray-50 rounded-r-lg">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Month label */}
      <p className="text-sm font-semibold text-gray-600">
        {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
        {selectedDivisionId && (
          <span className="ml-2 font-normal text-gray-400">
            — {divisions.find(d => d.id === selectedDivisionId)?.name}
          </span>
        )}
      </p>

      {/* Week rows */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400 animate-pulse">Memuat...</div>
      ) : (
        <div className="space-y-3">
          {weeks.map((week, i) => {
            const existing = getCalendarForWeek(week.weekStart)
            const key = `${week.weekStart}-${selectedDivisionId}`
            const isSaving = saving === key

            const weekStartDate = new Date(week.weekStart)
            const weekEndDate = new Date(week.weekEnd)

            return (
              <div key={week.weekStart} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Week info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">Minggu {i + 1}</span>
                      {existing && (
                        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', WEEK_TYPE_CONFIG[existing.weekType].bg)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', WEEK_TYPE_CONFIG[existing.weekType].dot)} />
                          {WEEK_TYPE_CONFIG[existing.weekType].label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {format(weekStartDate, 'd MMM', { locale: localeId })}
                      {' — '}
                      {format(weekEndDate, 'd MMM yyyy', { locale: localeId })}
                    </p>
                  </div>

                  {/* Type selector */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(['BUSY', 'NORMAL', 'LOW'] as const).map(type => {
                      const cfg = WEEK_TYPE_CONFIG[type]
                      const isActive = existing?.weekType === type
                      return (
                        <button
                          key={type}
                          onClick={() => setWeekType(week, type)}
                          disabled={isSaving}
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                            isActive
                              ? cn('ring-2 ring-offset-1', cfg.bg,
                                  type === 'BUSY' ? 'ring-yellow-400' : type === 'NORMAL' ? 'ring-blue-400' : 'ring-gray-400')
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white',
                            isSaving && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {cfg.label}
                        </button>
                      )
                    })}
                    {!existing && (
                      <span className="text-xs text-gray-400 italic ml-1">Belum diset</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-600">Keterangan tipe minggu:</p>
        <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <span className={cn('mt-0.5 h-2 w-2 rounded-full flex-shrink-0', WEEK_TYPE_CONFIG.BUSY.dot)} />
            <div><span className="font-medium">Busy</span> — Payday week (tgl 25 s/d twin date). Libur member bisa digeser/dikurangi.</div>
          </div>
          <div className="flex items-start gap-2">
            <span className={cn('mt-0.5 h-2 w-2 rounded-full flex-shrink-0', WEEK_TYPE_CONFIG.NORMAL.dot)} />
            <div><span className="font-medium">Normal</span> — Minggu biasa. Constraint libur berlaku normal.</div>
          </div>
          <div className="flex items-start gap-2">
            <span className={cn('mt-0.5 h-2 w-2 rounded-full flex-shrink-0', WEEK_TYPE_CONFIG.LOW.dot)} />
            <div><span className="font-medium">Low</span> — Minggu sepi. Jadwal bisa dikurangi.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
