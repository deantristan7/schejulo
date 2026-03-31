'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Plus, ChevronDown, ChevronRight, Pencil, PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils/cn'

type BrandContract = {
  id: string
  periodLabel: string
  contractedHours: number
}
type Brand = {
  id: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  contracts: BrandContract[]
}
type Division = {
  id: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
  brands: Brand[]
}

const currentPeriod = format(new Date(), 'yyyy-MM')
const periodStart = format(new Date(), "yyyy-MM-01'T'00:00:00")
const periodEnd = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd'T'23:59:59")

export function DivisionsClient({ initialDivisions }: { initialDivisions: Division[] }) {
  const router = useRouter()
  const [divisions, setDivisions] = useState(initialDivisions)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initialDivisions.map(d => d.id)))
  const [loading, setLoading] = useState(false)

  // Modal states
  const [divisionModal, setDivisionModal] = useState(false)
  const [brandModal, setBrandModal] = useState(false)
  const [contractModal, setContractModal] = useState(false)
  const [editDivision, setEditDivision] = useState<Division | null>(null)
  const [editBrand, setEditBrand] = useState<Brand | null>(null)
  const [targetDivisionId, setTargetDivisionId] = useState('')
  const [targetBrandId, setTargetBrandId] = useState('')

  // Forms
  const [divForm, setDivForm] = useState({ name: '', description: '' })
  const [brandForm, setBrandForm] = useState({ name: '', contractedHours: 200 })
  const [contractForm, setContractForm] = useState({ periodLabel: currentPeriod, contractedHours: 200 })

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openCreateDivision() {
    setEditDivision(null)
    setDivForm({ name: '', description: '' })
    setDivisionModal(true)
  }
  function openEditDivision(d: Division) {
    setEditDivision(d)
    setDivForm({ name: d.name, description: d.description ?? '' })
    setDivisionModal(true)
  }
  function openCreateBrand(divisionId: string) {
    setTargetDivisionId(divisionId)
    setEditBrand(null)
    setBrandForm({ name: '', contractedHours: 200 })
    setBrandModal(true)
  }
  function openEditBrand(b: Brand) {
    setEditBrand(b)
    setBrandForm({ name: b.name, contractedHours: b.contracts[0]?.contractedHours ?? 200 })
    setBrandModal(true)
  }
  function openAddContract(brandId: string) {
    setTargetBrandId(brandId)
    setContractForm({ periodLabel: currentPeriod, contractedHours: 200 })
    setContractModal(true)
  }

  async function submitDivision(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editDivision ? `/api/divisions/${editDivision.id}` : '/api/divisions'
      const method = editDivision ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(divForm),
      })
      if (!res.ok) throw new Error()
      toast.success(editDivision ? 'Divisi diperbarui' : 'Divisi ditambahkan')
      setDivisionModal(false)
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan divisi')
    } finally {
      setLoading(false)
    }
  }

  async function submitBrand(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (editBrand) {
        await fetch(`/api/brands/${editBrand.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: brandForm.name }),
        })
      } else {
        await fetch('/api/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: brandForm.name,
            divisionId: targetDivisionId,
            contract: {
              periodLabel: currentPeriod,
              contractedHours: brandForm.contractedHours,
              validFrom: periodStart,
              validUntil: periodEnd,
            },
          }),
        })
      }
      toast.success(editBrand ? 'Brand diperbarui' : 'Brand ditambahkan')
      setBrandModal(false)
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan brand')
    } finally {
      setLoading(false)
    }
  }

  async function submitContract(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/brands/${targetBrandId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contractForm,
          contractedHours: Number(contractForm.contractedHours),
          validFrom: periodStart,
          validUntil: periodEnd,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Kontrak disimpan')
      setContractModal(false)
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan kontrak')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Divisi & Brand</h2>
          <p className="text-sm text-gray-500">{divisions.length} divisi aktif</p>
        </div>
        <Button onClick={openCreateDivision}>
          <Plus className="h-4 w-4" />
          Tambah Divisi
        </Button>
      </div>

      {/* Division list */}
      <div className="space-y-3">
        {divisions.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
            Belum ada divisi
          </div>
        )}
        {divisions.map((div) => (
          <div key={div.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Division header */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(div.id)}
            >
              <div className="flex items-center gap-2">
                {expanded.has(div.id) ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-semibold text-gray-900">{div.name}</span>
                {div.description && (
                  <span className="text-sm text-gray-400">— {div.description}</span>
                )}
                <Badge variant={div.status === 'ACTIVE' ? 'active' : 'inactive'}>
                  {div.brands.filter(b => b.status === 'ACTIVE').length} brand
                </Badge>
              </div>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => openCreateBrand(div.id)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Brand
                </button>
                <button
                  onClick={() => openEditDivision(div)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Brands */}
            {expanded.has(div.id) && (
              <div className="border-t border-gray-100">
                {div.brands.length === 0 ? (
                  <p className="px-10 py-3 text-sm text-gray-400 italic">Belum ada brand</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-10 py-2 text-left text-xs font-medium text-gray-500">Brand</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Kontrak {currentPeriod}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {div.brands.map((brand) => {
                        const contract = brand.contracts.find(c => c.periodLabel === currentPeriod)
                        return (
                          <tr key={brand.id} className={cn('hover:bg-gray-50', brand.status === 'INACTIVE' && 'opacity-50')}>
                            <td className="px-10 py-2.5 font-medium text-gray-800">{brand.name}</td>
                            <td className="px-4 py-2.5 text-gray-600">
                              {contract ? `${contract.contractedHours} jam` : (
                                <span className="text-gray-400 italic text-xs">Belum ada</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant={brand.status === 'ACTIVE' ? 'active' : 'inactive'}>
                                {brand.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openAddContract(brand.id)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                                  title="Set kontrak jam"
                                >
                                  <PackagePlus className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => openEditBrand(brand)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Division Modal */}
      <Modal open={divisionModal} onClose={() => setDivisionModal(false)} title={editDivision ? 'Edit Divisi' : 'Tambah Divisi'}>
        <form onSubmit={submitDivision} className="space-y-4">
          <Input label="Nama Divisi" value={divForm.name} onChange={e => setDivForm(f => ({ ...f, name: e.target.value }))} placeholder="Beauty, Puma, dll" required />
          <Input label="Deskripsi (opsional)" value={divForm.description} onChange={e => setDivForm(f => ({ ...f, description: e.target.value }))} placeholder="Keterangan singkat" />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setDivisionModal(false)}>Batal</Button>
            <Button type="submit" loading={loading}>{editDivision ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>

      {/* Brand Modal */}
      <Modal open={brandModal} onClose={() => setBrandModal(false)} title={editBrand ? 'Edit Brand' : 'Tambah Brand'}>
        <form onSubmit={submitBrand} className="space-y-4">
          <Input label="Nama Brand" value={brandForm.name} onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} placeholder="Somethinc, Puma Run, dll" required />
          {!editBrand && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Kontrak Jam ({currentPeriod})</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={brandForm.contractedHours}
                  onChange={e => setBrandForm(f => ({ ...f, contractedHours: Number(e.target.value) }))}
                  className="h-9 w-28 rounded-lg border border-gray-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  min={1}
                />
                <span className="text-sm text-gray-500">jam/bulan</span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setBrandModal(false)}>Batal</Button>
            <Button type="submit" loading={loading}>{editBrand ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>

      {/* Contract Modal */}
      <Modal open={contractModal} onClose={() => setContractModal(false)} title="Set Kontrak Jam Brand">
        <form onSubmit={submitContract} className="space-y-4">
          <Input
            label="Periode"
            value={contractForm.periodLabel}
            onChange={e => setContractForm(f => ({ ...f, periodLabel: e.target.value }))}
            placeholder="yyyy-MM"
            pattern="\d{4}-\d{2}"
            required
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Kontrak Jam</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={contractForm.contractedHours}
                onChange={e => setContractForm(f => ({ ...f, contractedHours: Number(e.target.value) }))}
                className="h-9 w-28 rounded-lg border border-gray-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                min={1}
                required
              />
              <span className="text-sm text-gray-500">jam/bulan</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setContractModal(false)}>Batal</Button>
            <Button type="submit" loading={loading}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
