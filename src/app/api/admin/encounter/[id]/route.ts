import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'




export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { error } = await admin.from('encounter_participants').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const body = await req.json()

  if (body.action === 'roll') {
    const { data: current } = await admin
      .from('encounter_participants')
      .select('initiative_modifier')
      .eq('id', params.id)
      .single()

    const roll = Math.floor(Math.random() * 20) + 1
    const modifier = current?.initiative_modifier ?? 0

    const { data, error } = await admin
      .from('encounter_participants')
      .update({ initiative_roll: roll, initiative_total: roll + modifier })
      .eq('id', params.id)
      .select('*, characters(id, name, avatar_url, level, mental, resonance, alignment, is_player_character)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  // Generic field update (e.g. changing initiative_modifier)
  const { data, error } = await admin
    .from('encounter_participants')
    .update(body)
    .eq('id', params.id)
    .select('*, characters(id, name, avatar_url, level, mental, resonance, alignment, is_player_character)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
