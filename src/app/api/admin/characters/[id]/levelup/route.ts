import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

function isAuthenticated() {
  return cookies().get('gm_session')?.value === 'authenticated'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { newTrait } = await req.json()

  const { data: current, error: fetchError } = await admin
    .from('characters')
    .select('level, unspent_points, traits')
    .eq('id', params.id)
    .single()

  if (fetchError || !current) {
    return NextResponse.json({ error: fetchError?.message ?? 'Character not found' }, { status: 400 })
  }

  const updatedTraits = newTrait
    ? [...(current.traits ?? []), newTrait]
    : (current.traits ?? [])

  const { data, error } = await admin
    .from('characters')
    .update({
      level: (current.level ?? 1) + 1,
      unspent_points: (current.unspent_points ?? 0) + 1,
      traits: updatedTraits,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
