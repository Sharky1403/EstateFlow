import { createAdminClient } from '@/lib/supabase/admin'
import { InviteForm } from './InviteForm'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ token: string }>
  searchParams: Promise<{ email?: string }>
}

export default async function InvitePage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  // Supabase passes email as a query param in the invite link
  const email = resolvedSearchParams.email ?? ''

  if (!email) redirect('/login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">EstateFlow</h1>
          <p className="text-gray-500 mt-2">You've been invited 🎉</p>
        </div>
        <InviteForm email={email} token={resolvedParams.token} />
      </div>
    </div>
  )
}
