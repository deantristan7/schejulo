import { cn } from '@/lib/utils/cn'

const variants = {
  default: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  completed: 'bg-green-100 text-green-700',
  on_track: 'bg-blue-100 text-blue-700',
  at_risk: 'bg-yellow-100 text-yellow-700',
  critical: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
  busy: 'bg-yellow-100 text-yellow-700',
  normal: 'bg-blue-100 text-blue-600',
  low: 'bg-gray-100 text-gray-600',
}

interface BadgeProps {
  variant?: keyof typeof variants
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
