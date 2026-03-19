'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  {
    href: '/contractor/work-orders',
    label: 'Work Orders',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    href: '/contractor/profile',
    label: 'Profile & Insurance',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
]

export function ContractorNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
      {NAV.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/5 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-400 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.9)]" />
            )}
            <span className={cn(
              'shrink-0 transition-all duration-200',
              isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
            )}>
              {item.icon}
            </span>
            <span className="flex-1 tracking-[0.01em]">{item.label}</span>
            {isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 shadow-[0_0_6px_rgba(59,130,246,0.9)]" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
