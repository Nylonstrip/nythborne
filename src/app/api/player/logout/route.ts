import { createPlayerServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createPlayerServerClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/player/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}
