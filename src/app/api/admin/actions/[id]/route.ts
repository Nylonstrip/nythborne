import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'



export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { error } = await admin.from('actions').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
