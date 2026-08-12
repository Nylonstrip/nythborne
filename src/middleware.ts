import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function makeSupabaseServerClient(req: NextRequest, responseRef: { current: NextResponse }) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        responseRef.current = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) =>
          responseRef.current.cookies.set(name, value, options)
        )
      },
    },
  })
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const responseRef = { current: NextResponse.next({ request: req }) }

  // ── GM protection: real Supabase session + gm_users membership ──────────
  // Covers both admin pages AND every /api/admin/* route in one place.
  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isAdminLogin = pathname.startsWith('/admin/login')

  if (isAdminArea && !isAdminLogin) {
    const supabase = makeSupabaseServerClient(req, responseRef)
    const { data: { user } } = await supabase.auth.getUser()

    let isGM = false
    if (user) {
      const admin = createAdminClient()
      const { data: gmRow } = await admin
        .from('gm_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      isGM = !!gmRow
    }

    if (!user || !isGM) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return responseRef.current
  }

  // ── Player portal protection (unchanged) ─────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const supabase = makeSupabaseServerClient(req, responseRef)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return responseRef.current
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/dashboard/:path*', '/player/:path*'],
}
