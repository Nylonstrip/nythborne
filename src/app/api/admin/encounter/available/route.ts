import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

function isAuthenticated() {
  return cookies().get('gm_session')?.value === 'authenticated'
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const campaignId = req.nextUrl.searchParams.get('campaign_id')
  if (!campaignId) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

  // Anyone tagged to this campaign, plus global lore characters (no campaign tag)
  const { data: candidates, error } = await admin
    .from('characters')
    .select('id, name, avatar_url')
    .or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: existing } = await admin
    .from('encounter_participants')
    .select('character_id')
    .eq('campaign_id', campaignId)

  const existingIds = new Set((existing ?? []).map(e => e.character_id))
  const available = (candidates ?? []).filter(c => !existingIds.has(c.id))

  return NextResponse.json({ characters: available })
}
