import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const body = await req.json()
  const { from_table, from_id, to_table, to_id, relationship, notes } = body

  if (!from_table || !from_id || !to_table || !to_id || !relationship) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('entry_links')
    .insert({ from_table, from_id, to_table, to_id, relationship, notes: notes || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function GET() {

  const admin = createAdminClient()

  const { data: rawLinks } = await admin.from('entry_links').select('*')
  if (!rawLinks) return NextResponse.json({ links: [], nodes: [] })

  const [chars, timeline, rules, factions, nations] = await Promise.all([
    admin.from('characters').select('id, name, visibility'),
    admin.from('timeline_events').select('id, title, visibility'),
    admin.from('rules').select('id, title, visibility'),
    admin.from('factions').select('id, name, visibility'),
    admin.from('nations').select('id, name, visibility'),
  ])

  const nameMap: Record<string, { name: string; visibility: string }> = {}
  chars.data?.forEach(n => { nameMap[n.id] = { name: n.name, visibility: n.visibility } })
  timeline.data?.forEach(n => { nameMap[n.id] = { name: n.title, visibility: n.visibility } })
  rules.data?.forEach(n => { nameMap[n.id] = { name: n.title, visibility: n.visibility } })
  factions.data?.forEach(n => { nameMap[n.id] = { name: n.name, visibility: n.visibility } })
  nations.data?.forEach(n => { nameMap[n.id] = { name: n.name, visibility: n.visibility } })

  const resolved = rawLinks.map(l => ({
    id: l.id,
    from_table: l.from_table,
    from_id: l.from_id,
    from_name: nameMap[l.from_id]?.name || 'Unknown',
    to_table: l.to_table,
    to_id: l.to_id,
    to_name: nameMap[l.to_id]?.name || 'Unknown',
    relationship: l.relationship,
    notes: l.notes,
  }))

  const nodeIds = new Set([...rawLinks.map(l => l.from_id), ...rawLinks.map(l => l.to_id)])
  const nodes = Array.from(nodeIds).map(id => ({
    id,
    visibility: nameMap[id]?.visibility || 'hidden',
  }))

  return NextResponse.json({ links: resolved, nodes })
}
