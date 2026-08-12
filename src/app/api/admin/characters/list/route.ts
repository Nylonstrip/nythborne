import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

function isAuthenticated() {
  return cookies().get('gm_session')?.value === 'authenticated'
}

export async function GET() {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('characters').select('id, name').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ characters: data ?? [] })
}
