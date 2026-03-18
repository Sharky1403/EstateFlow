import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange' | 'purple' | 'teal' | 'indigo'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  dot?: boolean
  size?: 'sm' | 'md'
}

export function Badge({ label, variant = 'gray', dot = false, size = 'sm' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    green:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
    red:    'bg-red-50 text-red-700 ring-1 ring-red-200/80',
    yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80',
    blue:   'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80',
    gray:   'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
    orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/80',
    purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/80',
    teal:   'bg-teal-50 text-teal-700 ring-1 ring-teal-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/80',
  }

  const dotColor: Record<BadgeVariant, string> = {
    green: 'bg-emerald-500', red: 'bg-red-500', yellow: 'bg-amber-400',
    blue: 'bg-blue-500', gray: 'bg-slate-400', orange: 'bg-orange-500',
    purple: 'bg-violet-500', teal: 'bg-teal-500', indigo: 'bg-indigo-500',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      variants[variant],
      sizes[size]
    )}>
      {dot && (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full shrink-0',
          dotColor[variant],
          variant === 'green' && 'animate-pulse-soft'
        )} />
      )}
      {label}
    </span>
  )
}
