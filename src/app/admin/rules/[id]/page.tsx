export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import RuleForm from '@/components/admin/RuleForm'
import { notFound } from 'next/navigation'

export default async function EditRulePage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data: rule } = await admin.from('rules').select('*').eq('id', params.id).single()
  if (!rule) notFound()
  return <RuleForm rule={rule} />
}
