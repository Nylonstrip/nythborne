import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'


async function resolveName(admin: ReturnType<typeof createAdminClient>, table: string, id: string): Promise<string> {
  if (table === 'characters') {
    const { data } = await admin.from('characters').select('name').eq('id', id).single()
    return data?.name || 'Unknown'
  }
  if (table === 'timeline_events') {
    const { data } = await admin.from('timeline_events').select('title').eq('id', id).single()
    return data?.title || 'Unknown'
  }
  if (table === 'rules') {
    const { data } = await admin.from('rules').select('title').eq('id', id).single()
    return data?.title || 'Unknown'
  }
  if (table === 'factions') {
    const { data } = await admin.from('factions').select('name').eq('id', id).single()
    return data?.name || 'Unknown'
  }
  if (table === 'nations') {
    const { data } = await admin.from('nations').select('name').eq('id', id).single()
    return data?.name || 'Unknown'
  }
  return 'Unknown'
}

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const id = req.nextUrl.searchParams.get('id')
  const table = req.nextUrl.searchParams.get('table')
  if (!id || !table) return NextResponse.json({ connections: [] })

  const { data: links } = await admin
    .from('entry_links')
    .select('*')
    .or(`from_id.eq.${id},to_id.eq.${id}`)
    .order('created_at')

  if (!links) return NextResponse.json({ connections: [] })

  const connections = await Promise.all(
    links.map(async l => {
      const isFrom = l.from_id === id
      const otherId = isFrom ? l.to_id : l.from_id
      const otherTable = isFrom ? l.to_table : l.from_table
      const otherName = await resolveName(admin, otherTable, otherId)
      return {
        id: l.id,
        from_table: l.from_table,
        from_id: l.from_id,
        to_table: l.to_table,
        to_id: l.to_id,
        relationship: l.relationship,
        notes: l.notes,
        other_name: otherName,
        other_table: otherTable,
        other_id: otherId,
        direction: isFrom ? 'from' : 'to',
      }
    })
  )

  return NextResponse.json({ connections })
}
