import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_HOME: Record<string, string> = {
  landlord:   '/landlord/dashboard',
  tenant:     '/tenant/dashboard',
  contractor: '/contractor/work-orders',
}

const PUBLIC_PATHS = ['/login', '/register', '/verify', '/invite']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  // Build a Supabase client that can read/refresh session cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: object }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  // Not logged in trying to access a protected route → login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in trying to access login/register → go to their dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const dest = ROLE_HOME[profile?.role ?? ''] ?? '/login'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Prevent role cross-access: tenant accessing /landlord/... etc.
  if (user && (pathname.startsWith('/landlord') || pathname.startsWith('/tenant') || pathname.startsWith('/contractor'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? ''
    const allowed =
      (pathname.startsWith('/landlord')   && role === 'landlord') ||
      (pathname.startsWith('/tenant')     && role === 'tenant')   ||
      (pathname.startsWith('/contractor') && role === 'contractor')

    if (!allowed) {
      const dest = ROLE_HOME[role] ?? '/login'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
