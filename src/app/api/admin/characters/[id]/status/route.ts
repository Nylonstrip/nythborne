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
  // When approving, also make it visible to other players by default.
  // Adjust this if you want approved characters to stay 'hidden' until you set visibility manually.
  if (approval_status === 'approved') updates.visibility = 'revealed'

  const { data, error } = await admin
    .from('characters')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
