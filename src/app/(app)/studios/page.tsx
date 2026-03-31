export const dynamic = 'force-dynamic'

'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Tv2, Lock, Users, WifiOff, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'

type ActiveSession = {
  id: string
  memberName: string
  brandName: string
  sessionStart: string
  sessionEnd: string
  sessionHours: number
  status: string
}

type Studio = {
  id: string
  name: string
  studioNumber: number
  studioType: 'RESERVED' | 'SHARED'
  status: 'AVAILABLE' | 'IN_USE' | 'OFFLINE'
  reservedBrandId: string | null
  reservedBrand: { id: string; name: string; division: { name: string } } | null
  activeSession?: ActiveSession | null
}

type Brand = { id: string; name: string; division: { name: string } }

export default function StudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [editStudio, setEditStudio] = useState<Studio | null>(null)
  const [editForm, setEditForm] = useState({ reservedBrandId: '', status: 'AVAILABLE' as Studio['status'] })
  const [saving, setSaving] = useState(false)

  const fetchStudios = useCallback(async () => {
    setLoading(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const now = format(new Date(), 'HH:mm')

      const [studioRes, scheduleRes] = await Promise.all([
        fetch('/api/studios'),
        fetch(`/api/schedules?weekStart=${today}&weekEnd=${today}&status=CONFIRMED`),
      ])

      const [studioJson, scheduleJson] = await Promise.all([studioRes.json(), scheduleRes.json()])

      const schedules: {
        id: string
        studioId: string
        sessionStart: string
        sessionEnd: string
        sessionHours: number
        status: string
        member: { name: string }
        brand: { name: string }
      }[] = scheduleJson.data ?? []

      // Attach active session (sesi yang sedang berlangsung sekarang)
      const studiosWithSession = (studioJson.data ?? []).map((s: Studio) => {
        const active = schedules.find(
          (sch) => sch.studioId === s.id && sch.sessionStart <= now && sch.sessionEnd >= now
        )
        return {
          ...s,
          activeSession: active
            ? {
                id: active.id,
                memberName: active.member.name,
                brandName: active.brand.name,
                sessionStart: active.sessionStart,
                sessionEnd: active.sessionEnd,
                sessionHours: active.sessionHours,
                status: active.status,
              }
            : null,
        }
      })

      setStudios(studiosWithSession)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStudios() }, [fetchStudios])

  useEffect(() => {
    fetch('/api/brands').then(r => r.json()).then(json => setBrands(json.data ?? []))
  }, [])

  function openEdit(studio: Studio) {
    setEditStudio(studio)
    setEditForm({
      reservedBrandId: studio.reservedBrandId ?? '',
      status: studio.status,
    })
  }

  async function handleSave() {
    if (!editStudio) return
    setSaving(true)
    try {
      const res = await fetch(`/api/studios/${editStudio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservedBrandId: editForm.reservedBrandId || null,
          studioType: editForm.reservedBrandId ? 'RESERVED' : 'SHARED',
          status: editForm.status,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Studio diperbarui')
      setEditStudio(null)
      fetchStudios()
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const activeCount = studios.filter(s => s.activeSession).length
  const reservedCount = studios.filter(s => s.studioType === 'RESERVED').length
  const offlineCount = studios.filter(s => s.status === 'OFFLINE').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Studio Live</h2>
          <p className="text-sm text-gray-500">
            {activeCount} sedang live · {reservedCount} reserved · {offlineCount} offline
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchStudios} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Live now banner */}
      {activeCount > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <p className="text-sm font-medium text-green-700">
            {activeCount} studio sedang live sekarang
          </p>
        </div>
      )}

      {/* Studio Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {studios.map((studio) => {
          const isLive = !!studio.activeSession
          const isOffline = studio.status === 'OFFLINE'
          const isReserved = studio.studioType === 'RESERVED'

          return (
            <div
              key={studio.id}
              onClick={() => openEdit(studio)}
              className={cn(
                'relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md',
                isOffline
                  ? 'border-gray-200 bg-gray-50 opacity-60'
                  : isLive
                  ? 'border-green-400 bg-green-50 shadow-sm'
                  : isReserved
                  ? 'border-purple-200 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-indigo-200'
              )}
            >
              {/* Live pulse */}
              {isLive && (
                <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
              )}

              {/* Studio icon */}
              <div className={cn(
                'rounded-lg p-2 w-fit mb-3',
                isOffline ? 'bg-gray-200' : isLive ? 'bg-green-100' : isReserved ? 'bg-purple-100' : 'bg-gray-100'
              )}>
                {isOffline
                  ? <WifiOff className="h-5 w-5 text-gray-400" />
                  : isReserved
                  ? <Lock className="h-5 w-5 text-purple-600" />
                  : <Users className="h-5 w-5 text-gray-500" />
                }
              </div>

              {/* Studio name */}
              <p className="font-semibold text-gray-900 text-sm">{studio.name}</p>

              {/* Type badge */}
              <p className={cn(
                'text-xs mt-0.5 font-medium',
                isOffline ? 'text-gray-400'
                : isReserved ? 'text-purple-600'
                : 'text-gray-500'
              )}>
                {isOffline ? 'Offline' : isReserved ? 'Reserved' : 'Shared'}
              </p>

              {/* Reserved brand */}
              {isReserved && studio.reservedBrand && (
                <p className="text-[11px] text-purple-500 mt-1 truncate">
                  {studio.reservedBrand.name}
                </p>
              )}

              {/* Active session info */}
              {isLive && studio.activeSession && (
                <div className="mt-2 pt-2 border-t border-green-200 space-y-0.5">
                  <p className="text-xs font-medium text-green-800 truncate">
                    {studio.activeSession.memberName}
                  </p>
                  <p className="text-[11px] text-green-600 truncate">
                    {studio.activeSession.brandName}
                  </p>
                  <p className="text-[11px] text-green-500">
                    {studio.activeSession.sessionStart}–{studio.activeSession.sessionEnd}
                  </p>
                </div>
              )}

              {/* Available */}
              {!isLive && !isOffline && (
                <p className="mt-2 text-[11px] text-gray-400">Tersedia</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-green-400" />
          Sedang Live
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-purple-400" />
          Reserved
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-gray-300" />
          Shared / Tersedia
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-gray-400 opacity-50" />
          Offline
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editStudio}
        onClose={() => setEditStudio(null)}
        title={`Edit ${editStudio?.name}`}
        description="Atur reserved brand dan status studio"
      >
        <div className="space-y-4">
          {/* Reserved brand */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Reserved untuk Brand</label>
            <select
              value={editForm.reservedBrandId}
              onChange={e => setEditForm(f => ({ ...f, reservedBrandId: e.target.value }))}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">— Shared (tidak reserved) —</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.division.name})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              {editForm.reservedBrandId ? 'Studio hanya bisa dipakai brand ini.' : 'Studio bisa dipakai semua brand.'}
            </p>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Status Studio</label>
            <div className="grid grid-cols-3 gap-2">
              {(['AVAILABLE', 'IN_USE', 'OFFLINE'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditForm(f => ({ ...f, status: s }))}
                  className={cn(
                    'rounded-lg border py-2 text-xs font-medium transition-colors',
                    editForm.status === s
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  {s === 'AVAILABLE' ? 'Tersedia' : s === 'IN_USE' ? 'Dipakai' : 'Offline'}
                </button>
              ))}
            </div>
          </div>

          {/* Active session info */}
          {editStudio?.activeSession && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-green-700">🔴 Sedang Live</p>
              <p className="text-xs text-green-600">{editStudio.activeSession.memberName} · {editStudio.activeSession.brandName}</p>
              <p className="text-xs text-green-500">{editStudio.activeSession.sessionStart}–{editStudio.activeSession.sessionEnd}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setEditStudio(null)}>Batal</Button>
            <Button onClick={handleSave} loading={saving}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
