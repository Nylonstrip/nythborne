import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

function isAuthenticated() {
  return cookies().get('gm_session')?.value === 'authenticated'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { approval_status } = await req.json()
  if (!['approved', 'rejected'].includes(approval_status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const admin = createAdminClient()
  const updates: Record<string, unknown> = { approval_status }
  if (approval_status === 'approved') updates.visibility = 'revealed'

  const { data, error } = await admin
    .from('characters')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // On rejection, unlink it from the player's profile so they're free to submit a new one.
  // Without this, the player would be permanently stuck — the submission policy blocks
  // a second attempt as long as their profile still points at any character.
  if (approval_status === 'rejected') {
    await admin
      .from('player_profiles')
      .update({ character_id: null })
      .eq('character_id', params.id)
  }

  return NextResponse.json(data)
}
