import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

function isAuthenticated() {
  return cookies().get('gm_session')?.value === 'authenticated'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { status, gm_notes } = await req.json()

  if (!['approved', 'denied'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('action_requests')
    .update({ status, gm_notes: gm_notes || null, resolved_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
