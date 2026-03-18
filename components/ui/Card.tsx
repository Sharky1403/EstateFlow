import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'flat' | 'bordered' | 'glass' | 'dark' | 'gradient' | 'glow'
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
    flat:     'bg-white/60 border border-slate-200/60 backdrop-blur-sm',
    bordered: 'bg-white border-2 border-primary-200',
    glass:    'glass shadow-card',
    dark:     'bg-sidebar border border-white/10 text-white',
    gradient: 'bg-gradient-card border border-slate-200/60 shadow-card',
    glow:     'bg-white border border-primary-200/70 shadow-card shadow-glow-sm',
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
