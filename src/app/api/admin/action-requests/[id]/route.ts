import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (body.status) {
    if (!['approved', 'denied'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = body.status
    updates.resolved_at = new Date().toISOString()
  }
  if (body.outcome_description !== undefined) {
    updates.outcome_description = body.outcome_description
  }
  if (body.gm_notes !== undefined) {
    updates.gm_notes = body.gm_notes
  }

  const { data, error } = await admin
    .from('action_requests')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
