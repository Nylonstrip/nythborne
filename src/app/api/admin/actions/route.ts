import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

function isAuthenticated() {
  return cookies().get('gm_session')?.value === 'authenticated'
}

export async function GET() {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('actions')
    .select('*, characters(name)')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ actions: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const body = await req.json()
  const { data, error } = await admin
    .from('actions')
    .insert({
      name: body.name,
      description: body.description || null,
      character_id: body.character_id || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
