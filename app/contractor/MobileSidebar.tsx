'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ContractorNav } from './ContractorNav'

interface Props {
  initials: string
  fullName: string
}

export function MobileSidebar({ initials, fullName }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: '280px', background: 'linear-gradient(180deg, #080d1c 0%, #060b18 100%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 right-0 h-32 opacity-40"
          style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(59,130,246,0.25), transparent 70%)' }}
        />
        <div className="relative flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="EstateFlow" className="h-9 w-auto rounded-xl" />
            <div>
              <p className="text-white font-bold text-sm">EstateFlow</p>
              <p className="text-slate-500 text-xs">Contractor Portal</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="mx-4 h-px bg-white/5" />
        <ContractorNav />
        <div className="mx-4 h-px bg-white/5" />
        <div className="px-3 py-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{fullName}</p>
              <p className="text-slate-500 text-[11px]">Contractor</p>
            </div>
            <a href="/api/auth/logout" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
