import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

function isAuthenticated() {
  return cookies().get('gm_session')?.value === 'authenticated'
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const id = req.nextUrl.searchParams.get('id')

  let campaignQuery = admin.from('campaigns').select('*')
  campaignQuery = id ? campaignQuery.eq('id', id) : campaignQuery.eq('is_active', true)
  const { data: campaigns } = await campaignQuery.limit(1)
  const campaign = campaigns?.[0] ?? null

  if (!campaign) return NextResponse.json({ campaign: null, sessions: [] })

  const { data: sessions } = await admin
    .from('sessions')
    .select('*')
    .eq('campaign_id', campaign.id)
    .order('session_number', { ascending: true })

  const currentSession = sessions && sessions.length > 0 ? sessions[sessions.length - 1] : null

  return NextResponse.json({ campaign, sessions: sessions ?? [], currentSession })
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const body = await req.json()

  // Same protection as PATCH: only one campaign active at a time
  if (body.is_active === true) {
    await admin.from('campaigns').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { data, error } = await admin.from('campaigns').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
