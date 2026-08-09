export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import AdminTable from '@/components/admin/AdminTable'
import Link from 'next/link'
import styles from '../shared.module.css'

export default async function AdminNythsPage({
  searchParams,
}: {
  searchParams: { campaign?: string; all?: string }
}) {
  const admin = createAdminClient()
  const { data: campaigns } = await admin
    .from('campaigns')
    .select('id, name, is_active')
    .order('is_active', { ascending: false })
    .order('name')

  const showAll = searchParams.all === '1'
  const activeCampaign = campaigns?.find((c) => c.is_active)
  const targetCampaignId = searchParams.campaign ?? activeCampaign?.id

  let query = admin.from('characters').select('*').order('is_player_character', { ascending: false }).order('name')
  if (!showAll && targetCampaignId) {
    query = query.eq('campaign_id', targetCampaignId)
  }
  const { data: nyths } = await query

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'manifestation_name', label: 'Manifestation' },
    { key: 'is_player_character', label: 'Type', type: 'player_type' as const },
    { key: 'current_condition', label: 'Condition' },
    { key: 'visibility', label: 'Visibility', type: 'visibility' as const },
  ]

  const currentCampaignName = campaigns?.find((c) => c.id === targetCampaignId)?.name

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Characters</h1>
        <Link href="/admin/characters/new" className={styles.newBtn}>+ New Character</Link>
      </div>

      <div style={{ marginBottom: '16px', fontSize: '13px' }}>
        {showAll ? (
          <span>Showing all characters (global lore + every campaign).</span>
        ) : (
          <span>
            Showing active roster{currentCampaignName ? `: ${currentCampaignName}` : ''}.
          </span>
        )}
        <div style={{ marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {campaigns?.map((c) => (
            <Link
              key={c.id}
              href={`/admin/characters?campaign=${c.id}`}
              style={{ opacity: !showAll && targetCampaignId === c.id ? 1 : 0.6 }}
            >
              {c.name}
            </Link>
          ))}
          <Link href="/admin/characters?all=1" style={{ opacity: showAll ? 1 : 0.6 }}>
            View All / Global Lore
          </Link>
        </div>
      </div>

      <AdminTable rows={(nyths ?? []) as unknown as Record<string, unknown>[]} columns={columns} editBasePath="/admin/characters" />
    </div>
  )
}
