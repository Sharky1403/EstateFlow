'use client'

export function LogoutButton() {
  return (
    <a
      href="/api/auth/logout"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
    >
      🚪 Log Out
    </a>
  )
}
