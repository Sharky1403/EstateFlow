'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvitePage() {
  useEffect(() => {
    async function handleInvite() {
      const supabase = createClient()

      // Try PKCE flow first (?code= in query params)
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error || !data.user) { window.location.href = '/login'; return }
        await createProfileAndRedirect(supabase, data.user)
        return
      }

      // Try legacy flow (#access_token= in hash)
      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (error || !data.user) { window.location.href = '/login'; return }
        await createProfileAndRedirect(supabase, data.user)
        return
      }

      // No tokens — check if already signed in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        redirectByRole(profile?.role)
      } else {
        window.location.href = '/login'
      }
    }

    async function createProfileAndRedirect(supabase: any, user: any) {
      const meta = user.user_metadata ?? {}
      await supabase.from('profiles').upsert({
        id: user.id,
        role: meta.role ?? 'tenant',
        full_name: meta.full_name ?? user.email ?? '',
        ...(meta.unit_id ? { invited_unit_id: meta.unit_id } : {}),
      }, { onConflict: 'id' })
      window.location.href = '/reset-password?new_account=1'
    }

    function redirectByRole(role?: string) {
      if (role === 'landlord') window.location.href = '/landlord/dashboard'
      else if (role === 'contractor') window.location.href = '/contractor/work-orders'
      else window.location.href = '/tenant/dashboard'
    }

    handleInvite()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Setting up your account…</p>
      </div>
    </div>
  )
}
