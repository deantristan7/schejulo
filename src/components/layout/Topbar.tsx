'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/generate': 'Generate Jadwal',
  '/schedule': 'Jadwal',
  '/studios': 'Studio Live',
  '/kpi': 'KPI Brand',
  '/master/members': 'Master · Members',
  '/master/admins': 'Master · Admins',
  '/master/divisions': 'Master · Divisi & Brand',
  '/master/calendar': 'Master · Kalender Minggu',
}

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const title = titles[pathname] ?? 'Schejulo'

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-semibold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <span className="hidden md:inline">Schejulo</span>
        </div>
        <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
          A
        </div>
      </div>
    </header>
  )
}
