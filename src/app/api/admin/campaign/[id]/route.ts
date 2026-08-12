import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'



export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const body = await req.json()

  // Only one campaign should ever be "active" at once — if this one's
  // being set active, deactivate every other campaign first.
  if (body.is_active === true) {
    await admin.from('campaigns').update({ is_active: false }).neq('id', params.id)
  }

  const { data, error } = await admin.from('campaigns').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
