'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard, CalendarDays, Tv2, BarChart3, Sparkles,
  Users, UserCog, LayoutGrid, Calendar, ChevronDown, X,
} from 'lucide-react'
import { useState } from 'react'
import { usePostHog } from 'posthog-js/react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Generate Jadwal', href: '/generate', icon: Sparkles },
  { label: 'Jadwal', href: '/schedule', icon: CalendarDays },
  { label: 'Studio Live', href: '/studios', icon: Tv2 },
  { label: 'KPI Brand', href: '/kpi', icon: BarChart3 },
  {
    label: 'Master Data',
    icon: LayoutGrid,
    children: [
      { label: 'Members', href: '/master/members', icon: Users },
      { label: 'Admins', href: '/master/admins', icon: UserCog },
      { label: 'Divisi & Brand', href: '/master/divisions', icon: LayoutGrid },
      { label: 'Kalender Minggu', href: '/master/calendar', icon: Calendar },
    ],
  },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const posthog = usePostHog()
  const [masterOpen, setMasterOpen] = useState(pathname.startsWith('/master'))

  function trackNav(label: string) {
    posthog?.capture('sidebar_nav_clicked', { page: label })
    onClose?.()
  }

  const content = (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4 border-b border-gray-200">
        <span className="text-lg font-bold text-indigo-600 tracking-tight">Schejulo</span>
        {onClose && (
          <button onClick={onClose} className="lg:hidden rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          if (item.children) {
            const isActive = pathname.startsWith('/master')
            return (
              <div key={item.label}>
                <button
                  onClick={() => setMasterOpen(o => !o)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </div>
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', masterOpen && 'rotate-180')} />
                </button>
                {masterOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => trackNav(child.label)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                          pathname === child.href
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <child.icon className="h-3.5 w-3.5 shrink-0" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => trackNav(item.label)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-400">Schejulo v0.1.0</p>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-screen flex-shrink-0">{content}</div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  )
}
