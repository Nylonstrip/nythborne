import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const q = req.nextUrl.searchParams.get('q') || ''
  const excludeId = req.nextUrl.searchParams.get('exclude_id') || ''
  if (q.length < 2) return NextResponse.json({ results: [] })

  const pattern = `%${q}%`

  const [nyths, timeline, rules, factions, nations] = await Promise.all([
    admin.from('characters').select('id, name').ilike('name', pattern).limit(5),
    admin.from('timeline_events').select('id, title').ilike('title', pattern).limit(5),
    admin.from('rules').select('id, title').ilike('title', pattern).limit(5),
    admin.from('factions').select('id, name').ilike('name', pattern).limit(5),
    admin.from('nations').select('id, name').ilike('name', pattern).limit(5),
  ])

  const results = [
    ...(nyths.data || []).map(n => ({ id: n.id, name: n.name, table: 'characters' })),
    ...(timeline.data || []).map(n => ({ id: n.id, name: n.title, table: 'timeline_events' })),
    ...(rules.data || []).map(n => ({ id: n.id, name: n.title, table: 'rules' })),
    ...(factions.data || []).map(n => ({ id: n.id, name: n.name, table: 'factions' })),
    ...(nations.data || []).map(n => ({ id: n.id, name: n.name, table: 'nations' })),
  ].filter(r => r.id !== excludeId)

  return NextResponse.json({ results })
}
