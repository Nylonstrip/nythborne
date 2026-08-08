export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import NationForm from '@/components/admin/NationForm'
import { notFound } from 'next/navigation'

export default async function EditNationPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data: nation } = await admin.from('nations').select('*').eq('id', params.id).single()
  if (!nation) notFound()
  return <NationForm nation={nation} />
}
