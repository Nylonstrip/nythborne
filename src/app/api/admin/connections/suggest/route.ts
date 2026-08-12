import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const { entryId, entryTable, text } = await req.json()
  if (!entryId || !entryTable || !text) return NextResponse.json({ suggestions: [] })

  const { data, error } = await admin.rpc('suggest_entry_connections', {
    p_entry_id: entryId,
    p_entry_table: entryTable,
    p_text: text,
  })

  if (error) {
    console.error('Suggest error:', error)
    return NextResponse.json({ suggestions: [] })
  }

  // Dedupe by suggested_to_id
  const seen = new Set<string>()
  const deduped = (data || []).filter((s: { suggested_to_id: string }) => {
    if (seen.has(s.suggested_to_id)) return false
    seen.add(s.suggested_to_id)
    return true
  })

  return NextResponse.json({ suggestions: deduped })
}
