import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'




export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('characters').select('id, name').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ characters: data ?? [] })
}
