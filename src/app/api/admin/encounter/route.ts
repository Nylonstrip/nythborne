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

  const { data, error } = await admin
    .from('encounter_participants')
    .select('*, characters(id, name, avatar_url, level, mental, resonance, alignment, is_player_character)')
    .eq('campaign_id', campaignId)
    .order('initiative_total', { ascending: false, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ participants: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const body = await req.json()

  // Mandatory: a character must be revealed (or public) before it can enter an
  // encounter, so nothing hidden ever reaches the player-facing Play page.
  const { data: char, error: charError } = await admin
    .from('characters')
    .select('visibility')
    .eq('id', body.character_id)
    .single()

  if (charError || !char) {
    return NextResponse.json({ error: 'Character not found' }, { status: 400 })
  }
  if (char.visibility === 'hidden') {
    return NextResponse.json({ error: 'This character is still Hidden — reveal them before adding to an encounter.' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('encounter_participants')
    .insert({
      campaign_id: body.campaign_id,
      character_id: body.character_id,
      initiative_modifier: body.initiative_modifier ?? 0,
    })
    .select('*, characters(id, name, avatar_url, level, mental, resonance, alignment, is_player_character)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
