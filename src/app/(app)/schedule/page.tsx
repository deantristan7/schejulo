export const dynamic = 'force-dynamic'

'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CheckCheck, X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScheduleChip } from '@/components/schedule/ScheduleChip'
import { Badge } from '@/components/ui/badge'
import { useConfirm } from '@/components/ui/confirm-dialog'
import toast from 'react-hot-toast'

type Schedule = {
  id: string
  workDate: string
  sessionStart: string
  sessionEnd: string
  sessionHours: number
  sessionNumber: number
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
  notes: string | null
  member: { id: string; name: string }
  brand: { id: string; name: string; division: { id: string; name: string } }
  studio: { id: string; name: string; studioNumber: number }
}

type FilterState = {
  divisionId: string
  brandId: string
  memberId: string
  status: string
}

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<FilterState>({ divisionId: '', brandId: '', memberId: '', status: '' })
  const [divisions, setDivisions] = useState<{ id: string; name: string }[]>([])
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])
  const [selectedSession, setSelectedSession] = useState<Schedule | null>(null)
  const confirm = useConfirm()
  const [updating, setUpdating] = useState<string | null>(null)

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        ...(filters.divisionId && { divisionId: filters.divisionId }),
        ...(filters.brandId && { brandId: filters.brandId }),
        ...(filters.memberId && { memberId: filters.memberId }),
        ...(filters.status && { status: filters.status }),
      })
      const res = await fetch(`/api/schedules?${params}`)
      const json = await res.json()
      setSchedules(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [weekStart.toISOString(), filters])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  useEffect(() => {
    Promise.all([
      fetch('/api/divisions').then(r => r.json()),
      fetch('/api/members').then(r => r.json()),
    ]).then(([divData, memData]) => {
      setDivisions(divData.data ?? [])
      setMembers(memData.data ?? [])
    })
  }, [])

  async function updateStatus(id: string, status: 'CONFIRMED' | 'CANCELLED') {
    setUpdating(id)
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status } : s))
      setSelectedSession(prev => prev?.id === id ? { ...prev, status } : prev)
      toast.success(status === 'CONFIRMED' ? 'Sesi dikonfirmasi' : 'Sesi dibatalkan')
    } catch {
      toast.error('Gagal mengubah status')
    } finally {
      setUpdating(null)
    }
  }

  async function confirmAllDrafts() {
    const drafts = schedules.filter(s => s.status === 'DRAFT')
    if (!drafts.length) return toast('Tidak ada sesi draft', { icon: 'ℹ️' })
    const ok = await confirm({ title: `Konfirmasi ${drafts.length} sesi draft?`, description: 'Semua sesi draft minggu ini akan dikonfirmasi dan KPI brand akan terupdate.', confirmLabel: 'Konfirmasi Semua' })
    if (!ok) return

    setLoading(true)
    try {
      await Promise.all(drafts.map(s =>
        fetch(`/api/schedules/${s.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CONFIRMED' }),
        })
      ))
      setSchedules(prev => prev.map(s => s.status === 'DRAFT' ? { ...s, status: 'CONFIRMED' } : s))
      toast.success(`${drafts.length} sesi dikonfirmasi`)
    } catch {
      toast.error('Sebagian sesi gagal dikonfirmasi')
    } finally {
      setLoading(false)
    }
  }

  const getSessionsForDay = (day: Date) =>
    schedules.filter(s => isSameDay(new Date(s.workDate), day))

  const draftCount = schedules.filter(s => s.status === 'DRAFT').length
  const confirmedCount = schedules.filter(s => s.status === 'CONFIRMED').length

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Jadwal Mingguan</h2>
          <p className="text-sm text-gray-500">
            {format(weekStart, 'd MMM', { locale: localeId })} – {format(weekEnd, 'd MMM yyyy', { locale: localeId })}
            {draftCount > 0 && <span className="ml-2 text-yellow-600">· {draftCount} draft</span>}
            {confirmedCount > 0 && <span className="ml-2 text-green-600">· {confirmedCount} confirmed</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {draftCount > 0 && (
            <Button variant="secondary" size="sm" onClick={confirmAllDrafts}>
              <CheckCheck className="h-3.5 w-3.5" />
              Konfirmasi Semua Draft
            </Button>
          )}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setCurrentWeek(w => subWeeks(w, 1))}
              className="p-2 hover:bg-gray-50 rounded-l-lg"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 border-x border-gray-200"
            >
              Hari Ini
            </button>
            <button
              onClick={() => setCurrentWeek(w => addWeeks(w, 1))}
              className="p-2 hover:bg-gray-50 rounded-r-lg"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <select
          value={filters.divisionId}
          onChange={e => setFilters(f => ({ ...f, divisionId: e.target.value, brandId: '' }))}
          className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Semua Divisi</option>
          {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select
          value={filters.memberId}
          onChange={e => setFilters(f => ({ ...f, memberId: e.target.value }))}
          className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Semua Member</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {(filters.divisionId || filters.memberId || filters.status) && (
          <button
            onClick={() => setFilters({ divisionId: '', brandId: '', memberId: '', status: '' })}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <X className="h-3 w-3" /> Reset
          </button>
        )}
        {loading && <span className="text-xs text-gray-400 animate-pulse">Memuat...</span>}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white">
        <div className="grid grid-cols-7 min-w-[900px]">
          {/* Day headers */}
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, new Date())
            const sessions = getSessionsForDay(day)
            return (
              <div
                key={day.toISOString()}
                className={`border-b border-r border-gray-200 px-3 py-2 last:border-r-0 ${isToday ? 'bg-indigo-50' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isToday ? 'text-indigo-700' : 'text-gray-500'}`}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className={`text-xs ${isToday ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                {sessions.length > 0 && (
                  <div className="mt-1 flex gap-1">
                    <span className="text-[10px] text-gray-400">{sessions.length} sesi</span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Day cells */}
          {weekDays.map((day) => {
            const sessions = getSessionsForDay(day)
            const isToday = isSameDay(day, new Date())
            return (
              <div
                key={`cell-${day.toISOString()}`}
                className={`border-r border-gray-200 last:border-r-0 p-2 space-y-1.5 min-h-[200px] align-top ${isToday ? 'bg-indigo-50/30' : ''}`}
              >
                {sessions.length === 0 ? (
                  <div className="flex items-center justify-center h-16">
                    <span className="text-xs text-gray-300">—</span>
                  </div>
                ) : (
                  sessions.map(s => (
                    <ScheduleChip
                      key={s.id}
                      memberName={s.member.name}
                      brandName={s.brand.name}
                      studioName={s.studio.name}
                      sessionStart={s.sessionStart}
                      sessionEnd={s.sessionEnd}
                      sessionNumber={s.sessionNumber}
                      status={s.status}
                      onClick={() => setSelectedSession(s)}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Session Detail Sidebar */}
      {selectedSession && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedSession(null)} />
          <div className="relative z-50 w-80 bg-white shadow-xl border-l border-gray-200 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Detail Sesi</h3>
              <button onClick={() => setSelectedSession(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 p-5 space-y-4 overflow-y-auto">
              <div>
                <Badge
                  variant={
                    selectedSession.status === 'CONFIRMED' ? 'confirmed'
                    : selectedSession.status === 'CANCELLED' ? 'cancelled'
                    : 'draft'
                  }
                >
                  {selectedSession.status}
                </Badge>
              </div>
              <DetailRow label="Member" value={selectedSession.member.name} />
              <DetailRow label="Brand" value={`${selectedSession.brand.name} (${selectedSession.brand.division.name})`} />
              <DetailRow label="Studio" value={selectedSession.studio.name} />
              <DetailRow
                label="Tanggal"
                value={format(new Date(selectedSession.workDate), 'EEEE, d MMMM yyyy', { locale: localeId })}
              />
              <DetailRow label="Jam" value={`${selectedSession.sessionStart} – ${selectedSession.sessionEnd} (${selectedSession.sessionHours} jam)`} />
              <DetailRow label="Sesi ke-" value={String(selectedSession.sessionNumber)} />
              {selectedSession.notes && <DetailRow label="Catatan" value={selectedSession.notes} />}
            </div>
            {selectedSession.status === 'DRAFT' && (
              <div className="border-t border-gray-200 p-4 space-y-2">
                <button
                  onClick={() => updateStatus(selectedSession.id, 'CONFIRMED')}
                  disabled={!!updating}
                  className="w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {updating === selectedSession.id ? 'Menyimpan...' : '✅ Konfirmasi Sesi'}
                </button>
                <button
                  onClick={() => updateStatus(selectedSession.id, 'CANCELLED')}
                  disabled={!!updating}
                  className="w-full rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  ✕ Batalkan Sesi
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800">{value}</p>
    </div>
  )
}
