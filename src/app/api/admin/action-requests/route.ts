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
