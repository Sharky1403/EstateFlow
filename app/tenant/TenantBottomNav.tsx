'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  {
    href: '/tenant/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/tenant/rent',
    label: 'Rent',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/tenant/maintenance',
    label: 'Issues',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    href: '/tenant/announcements',
    label: 'News',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
  },
  {
    href: '/tenant/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

export function TenantBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40"
      style={{
        background: 'linear-gradient(180deg, #080d1c 0%, #060b18 100%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div className="max-w-2xl mx-auto flex h-16 items-stretch">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 relative"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-b-full shadow-[0_2px_8px_rgba(59,130,246,0.8)]" />
              )}
              <span className={cn(
                'transition-all duration-200',
                isActive ? 'text-blue-400 scale-110 drop-shadow-[0_0_6px_rgba(59,130,246,0.7)]' : 'text-slate-500'
              )}>
                {link.icon(isActive)}
              </span>
              <span className={cn(
                'text-[10px] font-semibold tracking-wide transition-colors duration-200',
                isActive ? 'text-blue-400' : 'text-slate-500'
              )}>
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
