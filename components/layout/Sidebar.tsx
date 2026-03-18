'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
const landlordLinks = [
  { href: '/landlord/dashboard', label: '📊 Dashboard' },
  { href: '/landlord/properties', label: '🏢 Properties' },
  { href: '/landlord/leases', label: '📄 Leases' },
  { href: '/landlord/finance', label: '💰 Finance' },
  { href: '/landlord/maintenance', label: '🔧 Maintenance' },
  { href: '/landlord/communication', label: '📣 Communication' },
  { href: '/landlord/settings', label: '⚙️ Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-gray-200 bg-white flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary">EstateFlow</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {landlordLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === link.href
                ? 'bg-blue-50 text-primary'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <a
          href="/api/auth/logout"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          🚪 Log Out
        </a>
      </div>
    </aside>
  )
}
