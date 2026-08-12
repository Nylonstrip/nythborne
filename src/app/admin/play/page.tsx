export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import PlayBoard from './PlayBoard'

export default async function AdminPlayPage() {
  const admin = createAdminClient()
  const { data: campaigns } = await admin
    .from('campaigns')
    .select('id, name')
    .eq('is_active', true)
    .limit(1)

  const activeCampaign = campaigns?.[0] ?? null

  return <PlayBoard campaign={activeCampaign} />
}
