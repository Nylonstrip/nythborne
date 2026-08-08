import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  let response = NextResponse.next({ request: req })

  // ── GM Admin protection (existing cookie-based system) ──────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = req.cookies.get('gm_session')
    if (!session || session.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return response
  }

  // ── Player portal protection (Supabase Auth) ────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          )
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/player/login', req.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/player/:path*'],
}
