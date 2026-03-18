import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'flat' | 'bordered' | 'glass' | 'dark'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
}: CardProps) {
  const variants = {
    default:  'bg-white border border-slate-200/80 shadow-card',
    elevated: 'bg-white border border-slate-100 shadow-card-md',
    flat:     'bg-slate-50/80 border border-slate-200/60',
    bordered: 'bg-white border-2 border-primary-200',
    glass:    'glass shadow-card',
    dark:     'bg-slate-900 border border-white/10 text-white',
  }

  const paddings = {
    none: '',
    sm:   'p-4',
    md:   'p-5',
    lg:   'p-6',
    xl:   'p-8',
  }

  return (
    <div
      className={cn(
        'rounded-2xl',
        variants[variant],
        paddings[padding],
        hover && 'card-hover cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
