import { type LucideIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 text-center', className)}>
      <div className="rounded-2xl bg-gray-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-400 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button size="sm" onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  )
}
