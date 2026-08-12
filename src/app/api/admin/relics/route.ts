import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'


export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const body = await req.json()
  const { data, error } = await admin.from('relics').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
