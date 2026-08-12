import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

function isAuthenticated() {
  return cookies().get('gm_session')?.value === 'authenticated'
}

export async function PATCH(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { campaign_id } = await req.json()
  if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

  const { data: participants, error: fetchError } = await admin
    .from('encounter_participants')
    .select('id, is_current_turn, initiative_total, created_at')
    .eq('campaign_id', campaign_id)
    .order('initiative_total', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 })
  if (!participants || participants.length === 0) {
    return NextResponse.json({ error: 'No participants in this encounter' }, { status: 400 })
  }

  const currentIndex = participants.findIndex(p => p.is_current_turn)
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % participants.length

  // Clear every current-turn flag, then set the new one — keeps this correct
  // even if something got out of sync (e.g. two flags set somehow).
  await admin.from('encounter_participants').update({ is_current_turn: false }).eq('campaign_id', campaign_id)

  const { data, error } = await admin
    .from('encounter_participants')
    .update({ is_current_turn: true })
    .eq('id', participants[nextIndex].id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
