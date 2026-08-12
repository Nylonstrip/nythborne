import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('actions')
    .select('*, characters(name)')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ actions: data ?? [] })
}

export async function POST(req: NextRequest) {
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
