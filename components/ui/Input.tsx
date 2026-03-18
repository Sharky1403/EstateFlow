import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  dark?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, className, id, dark, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              dark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className={cn(
              'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5',
              dark ? 'text-slate-500' : 'text-slate-400'
            )}>
              {prefix}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-xl border px-3.5 py-2.5 text-sm',
              'placeholder:text-slate-300',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2',
              dark
                ? [
                    'bg-white/6 border-white/10 text-white placeholder:text-slate-600',
                    'hover:border-white/20',
                    'focus:ring-blue-500/25 focus:border-blue-400/60',
                    error && 'border-red-400/50 bg-red-500/10 focus:ring-red-400/25',
                  ]
                : [
                    'bg-white text-slate-800 border-slate-200',
                    'hover:border-slate-300',
                    'focus:ring-primary-500/20 focus:border-primary-400',
                    error && 'border-red-300 bg-red-50/60 focus:ring-red-400/20 focus:border-red-400',
                  ],
              prefix && 'pl-9',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
            <span className="shrink-0">⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p className={cn('text-xs', dark ? 'text-slate-500' : 'text-slate-400')}>{hint}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
