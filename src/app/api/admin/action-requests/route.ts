import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const campaignId = req.nextUrl.searchParams.get('campaign_id')
  if (!campaignId) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

  const { data, error } = await admin
    .from('action_requests')
    .select(`
      *,
      actions(name, description),
      encounter_participants!action_requests_participant_id_fkey(id, characters(name)),
      target:encounter_participants!action_requests_target_participant_id_fkey(id, characters(name))
    `)
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ requests: data ?? [] })
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const body = await req.json()

  // GM declaring an action directly (e.g. for an NPC) is auto-approved —
  // there's no one else to approve it, the GM is both actor and approver.
  const { data, error } = await admin
    .from('action_requests')
    .insert({
      campaign_id: body.campaign_id,
      participant_id: body.participant_id,
      action_id: body.action_id,
      target_participant_id: body.target_participant_id,
      status: 'approved',
      resolved_at: new Date().toISOString(),
    })
    .select(`
      *,
      actions(name, description),
      encounter_participants!action_requests_participant_id_fkey(id, characters(name)),
      target:encounter_participants!action_requests_target_participant_id_fkey(id, characters(name))
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
