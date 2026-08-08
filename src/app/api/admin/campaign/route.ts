import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

function isAuthenticated() { return cookies().get('gm_session')?.value === 'authenticated' }

export async function GET() {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data: campaigns } = await admin.from('campaigns').select('*').eq('is_active', true).limit(1)
  const campaign = campaigns?.[0] ?? null
  if (!campaign) return NextResponse.json({ campaign: null, sessions: [] })
  const { data: sessions } = await admin.from('sessions').select('*').eq('campaign_id', campaign.id).order('session_number')
  const currentSession = sessions?.[sessions.length - 1] ?? null
  return NextResponse.json({ campaign, sessions, currentSession })
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const body = await req.json()
  const { data, error } = await admin.from('campaigns').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
