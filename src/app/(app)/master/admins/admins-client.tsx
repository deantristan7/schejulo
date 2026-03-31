'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Pencil, PowerOff, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils/cn'

type AdminDivision = { division: { id: string; name: string } }
type Admin = {
  id: string
  name: string
  telegramId: string | null
  status: 'ACTIVE' | 'INACTIVE'
  divisions: AdminDivision[]
  _count: { members: number; schedules: number }
}
type Division = { id: string; name: string }

interface Props {
  initialAdmins: Admin[]
  divisions: Division[]
}

export function AdminsClient({ initialAdmins, divisions }: Props) {
  const router = useRouter()
  const [admins, setAdmins] = useState(initialAdmins)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(false)
  const confirm = useConfirm()
  const [form, setForm] = useState({ name: '', telegramId: '', divisionIds: [] as string[] })

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditTarget(null)
    setForm({ name: '', telegramId: '', divisionIds: [] })
    setModalOpen(true)
  }

  function openEdit(a: Admin) {
    setEditTarget(a)
    setForm({
      name: a.name,
      telegramId: a.telegramId ?? '',
      divisionIds: a.divisions.map(d => d.division.id),
    })
    setModalOpen(true)
  }

  function toggleDivision(id: string) {
    setForm(f => ({
      ...f,
      divisionIds: f.divisionIds.includes(id)
        ? f.divisionIds.filter(d => d !== id)
        : [...f.divisionIds, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        telegramId: form.telegramId || null,
        divisionIds: form.divisionIds,
      }
      const url = editTarget ? `/api/admins/${editTarget.id}` : '/api/admins'
      const method = editTarget ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(editTarget ? 'Admin diperbarui' : 'Admin ditambahkan')
      setModalOpen(false)
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan admin')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate(a: Admin) {
    const ok = await confirm({ title: `Nonaktifkan "${a.name}"?`, description: 'Admin tidak bisa mengelola jadwal setelah dinonaktifkan.', confirmLabel: 'Nonaktifkan', variant: 'danger' })
    if (!ok) return
    try {
      await fetch(`/api/admins/${a.id}`, { method: 'DELETE' })
      toast.success('Admin dinonaktifkan')
      setAdmins(prev => prev.map(x => x.id === a.id ? { ...x, status: 'INACTIVE' } : x))
    } catch {
      toast.error('Gagal menonaktifkan admin')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Admins</h2>
          <p className="text-sm text-gray-500">{admins.filter(a => a.status === 'ACTIVE').length} admin aktif</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah Admin
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama admin..."
          className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Nama</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Divisi</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Members</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Total Sesi</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  {search ? 'Tidak ada hasil' : 'Belum ada admin'}
                </td>
              </tr>
            ) : filtered.map(a => (
              <tr key={a.id} className={cn('hover:bg-gray-50', a.status === 'INACTIVE' && 'opacity-50')}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{a.name}</div>
                  {a.telegramId && <div className="text-xs text-gray-400">@{a.telegramId}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.divisions.length === 0
                      ? <span className="text-gray-400 italic text-xs">Belum ada</span>
                      : a.divisions.map(d => (
                          <Badge key={d.division.id} variant="default">{d.division.name}</Badge>
                        ))
                    }
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{a._count.members}</td>
                <td className="px-4 py-3 text-gray-600">{a._count.schedules}</td>
                <td className="px-4 py-3">
                  <Badge variant={a.status === 'ACTIVE' ? 'active' : 'inactive'}>
                    {a.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(a)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {a.status === 'ACTIVE' && (
                      <button onClick={() => handleDeactivate(a)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                        <PowerOff className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Admin' : 'Tambah Admin'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nama" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama admin / telco" required />
          <Input label="Telegram ID (opsional)" value={form.telegramId} onChange={e => setForm(f => ({ ...f, telegramId: e.target.value }))} placeholder="username tanpa @" />
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Divisi yang dikelola</label>
            <div className="flex flex-wrap gap-2">
              {divisions.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDivision(d.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    form.divisionIds.includes(d.id)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  {d.name}
                </button>
              ))}
              {divisions.length === 0 && <p className="text-xs text-gray-400 italic">Belum ada divisi — tambah di Master Divisi dulu</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={loading}>{editTarget ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
