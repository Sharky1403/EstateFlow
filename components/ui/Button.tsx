import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'outline' | 'success' | 'secondary' | 'gradient'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  icon,
  ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center font-semibold rounded-xl',
    'transition-all duration-150 ease-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-[0.97]',
    'select-none',
  ].join(' ')

  const variants = {
    primary: [
      'bg-gradient-to-b from-primary-500 to-primary-600 text-white',
      'shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.16)]',
      'hover:from-primary-400 hover:to-primary-500 hover:shadow-[0_3px_10px_rgba(37,99,235,0.38)]',
      'focus-visible:ring-primary-500',
    ].join(' '),
    gradient: [
      'bg-gradient-to-r from-primary-600 to-accent-600 text-white',
      'shadow-[0_1px_3px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]',
      'hover:from-primary-500 hover:to-accent-500 hover:shadow-[0_3px_14px_rgba(124,58,237,0.38)]',
      'focus-visible:ring-accent-500',
    ].join(' '),
    danger: [
      'bg-gradient-to-b from-red-500 to-red-600 text-white',
      'shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]',
      'hover:from-red-400 hover:to-red-500 hover:shadow-[0_3px_10px_rgba(220,38,38,0.32)]',
      'focus-visible:ring-red-500',
    ].join(' '),
    success: [
      'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white',
      'shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]',
      'hover:from-emerald-400 hover:to-emerald-500 hover:shadow-[0_3px_10px_rgba(16,185,129,0.32)]',
      'focus-visible:ring-emerald-500',
    ].join(' '),
    ghost: [
      'bg-transparent text-slate-600',
      'hover:bg-slate-100 hover:text-slate-900',
      'focus-visible:ring-slate-400',
    ].join(' '),
    outline: [
      'border border-slate-200 text-slate-700 bg-white',
      'shadow-xs',
      'hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900',
      'focus-visible:ring-slate-400',
    ].join(' '),
    secondary: [
      'bg-slate-100 text-slate-700',
      'hover:bg-slate-200 hover:text-slate-900',
      'focus-visible:ring-slate-400',
    ].join(' '),
  }

  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-lg',
    sm: 'text-xs px-3 py-2 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-sm px-5 py-3 gap-2',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
