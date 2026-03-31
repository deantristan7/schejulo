'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Plus, Search, Pencil, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { calculateDayOffPerWeek } from '@/lib/utils/schedule'

type Member = {
  id: string
  name: string
  telegramId: string | null
  status: 'ACTIVE' | 'INACTIVE'
  primaryAdmin: { id: string; name: string }
  contracts: {
    id: string
    periodLabel: string
    maxHoursPerMonth: number
    dayOffPerWeek: number
  }[]
}

type Admin = { id: string; name: string }

interface Props {
  initialMembers: Member[]
  admins: Admin[]
}

const CONTRACT_OPTIONS = [60, 80, 120, 160]
const currentPeriod = format(new Date(), 'yyyy-MM')

export function MembersClient({ initialMembers, admins }: Props) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    telegramId: '',
    primaryAdminId: '',
    maxHoursPerMonth: 80,
    addContract: true,
  })

  const confirm = useConfirm()
  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.primaryAdmin.name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditTarget(null)
    setForm({ name: '', telegramId: '', primaryAdminId: '', maxHoursPerMonth: 80, addContract: true })
    setModalOpen(true)
  }

  function openEdit(m: Member) {
    setEditTarget(m)
    setForm({
      name: m.name,
      telegramId: m.telegramId ?? '',
      primaryAdminId: m.primaryAdmin.id,
      maxHoursPerMonth: m.contracts[0]?.maxHoursPerMonth ?? 80,
      addContract: false,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const now = new Date()
      const payload = editTarget
        ? { name: form.name, telegramId: form.telegramId || null, primaryAdminId: form.primaryAdminId }
        : {
            name: form.name,
            telegramId: form.telegramId || undefined,
            primaryAdminId: form.primaryAdminId,
            ...(form.addContract && {
              contract: {
                periodLabel: currentPeriod,
                maxHoursPerMonth: form.maxHoursPerMonth,
                maxHoursPerDay: 8,
                maxSessionHours: 4,
                minSessionHours: 2,
                dayOffPerWeek: calculateDayOffPerWeek(form.maxHoursPerMonth),
                validFrom: format(now, "yyyy-MM-01'T'00:00:00"),
                validUntil: format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd'T'23:59:59"),
              },
            }),
          }

      const url = editTarget ? `/api/members/${editTarget.id}` : '/api/members'
      const method = editTarget ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Gagal menyimpan data')

      toast.success(editTarget ? 'Member diperbarui' : 'Member ditambahkan')
      setModalOpen(false)
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate(m: Member) {
    const ok = await confirm({ title: `Nonaktifkan "${m.name}"?`, description: 'Member tidak akan bisa diassign ke jadwal baru.', confirmLabel: 'Nonaktifkan', variant: 'danger' })
    if (!ok) return

    try {
      await fetch(`/api/members/${m.id}`, { method: 'DELETE' })
      toast.success('Member dinonaktifkan')
      setMembers((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, status: 'INACTIVE' } : x))
      )
    } catch {
      toast.error('Gagal menonaktifkan member')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Members</h2>
          <p className="text-sm text-gray-500">{members.filter((m) => m.status === 'ACTIVE').length} live host aktif</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Member
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau admin..."
            className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nama</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Admin</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Kontrak ({currentPeriod})</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Libur/minggu</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  {search ? 'Tidak ada hasil pencarian' : 'Belum ada member'}
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const contract = m.contracts[0]
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{m.name}</div>
                      {m.telegramId && (
                        <div className="text-xs text-gray-400">@{m.telegramId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.primaryAdmin.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {contract ? `${contract.maxHoursPerMonth} jam/bulan` : (
                        <span className="text-gray-400 italic">Belum ada kontrak</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {contract ? `${contract.dayOffPerWeek}x` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={m.status === 'ACTIVE' ? 'active' : 'inactive'}>
                        {m.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(m)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {m.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleDeactivate(m)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <PowerOff className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Member' : 'Tambah Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama"
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nama lengkap live host"
            required
          />
          <Input
            label="Telegram ID (opsional)"
            id="telegramId"
            value={form.telegramId}
            onChange={(e) => setForm((f) => ({ ...f, telegramId: e.target.value }))}
            placeholder="username tanpa @"
          />
          <Select
            label="Primary Admin"
            id="primaryAdminId"
            value={form.primaryAdminId}
            onChange={(e) => setForm((f) => ({ ...f, primaryAdminId: e.target.value }))}
            options={admins.map((a) => ({ value: a.id, label: a.name }))}
            placeholder="Pilih admin"
            required
          />
          {!editTarget && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Kontrak Bulan Ini ({currentPeriod})
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CONTRACT_OPTIONS.map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setForm((f) => ({ ...f, maxHoursPerMonth: h }))}
                    className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                      form.maxHoursPerMonth === h
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Libur: {calculateDayOffPerWeek(form.maxHoursPerMonth)}x per minggu
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editTarget ? 'Simpan Perubahan' : 'Tambah Member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
