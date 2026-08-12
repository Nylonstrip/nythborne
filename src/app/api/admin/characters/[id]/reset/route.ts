import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'



export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('characters')
    .update({
      level: 1,
      mental: 0,
      resonance: 0,
      alignment: 0,
      unspent_points: 0,
      traits: [],
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
