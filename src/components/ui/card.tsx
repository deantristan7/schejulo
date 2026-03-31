import { cn } from '@/lib/utils/cn'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn('px-5 pt-5 pb-3', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={cn('text-sm font-semibold text-gray-500 uppercase tracking-wide', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={cn('px-5 pb-5', className)}>
      {children}
    </div>
  )
}
