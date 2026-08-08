export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import CharacterForm from '@/components/admin/CharacterForm'
import { notFound } from 'next/navigation'

export default async function EditNythPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()
  const { data: nyth } = await admin.from('characters').select('*').eq('id', params.id).single()
  if (!nyth) notFound()
  return <CharacterForm nyth={nyth} />
}
