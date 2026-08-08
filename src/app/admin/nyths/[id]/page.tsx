export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import NythForm from '@/components/admin/NythForm'
import { notFound } from 'next/navigation'

export default async function EditNythPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data: nyth } = await admin.from('nyths').select('*').eq('id', params.id).single()
  if (!nyth) notFound()
  return <NythForm nyth={nyth} />
}
