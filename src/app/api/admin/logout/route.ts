import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  cookieStore.delete('gm_session')
  return NextResponse.redirect(new URL('/admin/login', req.url))
}
