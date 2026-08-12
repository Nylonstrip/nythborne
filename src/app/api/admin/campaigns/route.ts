import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'


export async function GET() {
  const admin = createAdminClient()

  const { data: campaigns, error } = await admin
    .from('campaigns')
    .select('id, name, is_active, current_session')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ campaigns: campaigns ?? [] })
}
