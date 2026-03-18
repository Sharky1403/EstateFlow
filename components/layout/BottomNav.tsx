'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tenantLinks = [
  { href: '/tenant/dashboard', label: '🏠', text: 'Home' },
  { href: '/tenant/rent', label: '💳', text: 'Rent' },
  { href: '/tenant/maintenance', label: '🔧', text: 'Issues' },
  { href: '/tenant/lease', label: '📄', text: 'Lease' },
  { href: '/tenant/profile', label: '👤', text: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white flex">
      {tenantLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'flex flex-1 flex-col items-center py-2 text-xs',
            pathname === link.href ? 'text-primary' : 'text-gray-500'
          )}
        >
          <span className="text-xl">{link.label}</span>
          {link.text}
        </Link>
      ))}
    </nav>
  )
}
