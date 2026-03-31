import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: string
    positive?: boolean
  }
  className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-indigo-600', trend, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          {trend && (
            <p className={cn('mt-1 text-xs font-medium', trend.positive ? 'text-green-600' : 'text-red-500')}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn('rounded-lg bg-indigo-50 p-2.5', iconColor.replace('text-', 'bg-').replace('600', '50'))}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
    </div>
  )
}
