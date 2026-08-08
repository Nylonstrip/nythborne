export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import RelicForm from '@/components/admin/RelicForm'
import { notFound } from 'next/navigation'

export default async function EditRelicPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data: relic } = await admin.from('relics').select('*').eq('id', params.id).single()
  if (!relic) notFound()
  return <RelicForm relic={relic} />
}
