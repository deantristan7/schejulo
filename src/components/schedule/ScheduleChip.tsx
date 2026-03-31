import { cn } from '@/lib/utils/cn'

interface ScheduleChipProps {
  memberName: string
  brandName: string
  studioName: string
  sessionStart: string
  sessionEnd: string
  sessionNumber: number
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
  onClick?: () => void
}

const sessionColors = {
  1: {
    DRAFT: 'border-blue-200 bg-blue-50 text-blue-800',
    CONFIRMED: 'border-blue-400 bg-blue-100 text-blue-900',
    CANCELLED: 'border-gray-200 bg-gray-50 text-gray-400 line-through',
  },
  2: {
    DRAFT: 'border-green-200 bg-green-50 text-green-800',
    CONFIRMED: 'border-green-400 bg-green-100 text-green-900',
    CANCELLED: 'border-gray-200 bg-gray-50 text-gray-400 line-through',
  },
} as const

export function ScheduleChip({
  memberName,
  brandName,
  studioName,
  sessionStart,
  sessionEnd,
  sessionNumber,
  status,
  onClick,
}: ScheduleChipProps) {
  const colorKey = (sessionNumber === 1 ? 1 : 2) as 1 | 2
  const colors = sessionColors[colorKey][status]

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border px-2 py-1.5 text-xs cursor-pointer transition-opacity hover:opacity-80',
        colors
      )}
    >
      <div className="font-semibold truncate">{memberName}</div>
      <div className="truncate text-[11px] opacity-80">{brandName}</div>
      <div className="flex items-center justify-between mt-0.5 opacity-70">
        <span>{studioName}</span>
        <span>{sessionStart}–{sessionEnd}</span>
      </div>
      {status === 'DRAFT' && (
        <div className="mt-0.5 text-[10px] opacity-60">Draft</div>
      )}
    </div>
  )
}
