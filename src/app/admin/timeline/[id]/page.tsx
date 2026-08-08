export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import TimelineForm from '@/components/admin/TimelineForm'
import { notFound } from 'next/navigation'

export default async function EditTimelinePage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data: event } = await admin.from('timeline_events').select('*').eq('id', params.id).single()
  if (!event) notFound()
  return <TimelineForm event={event} />
}
