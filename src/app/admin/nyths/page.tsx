export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import AdminTable from '@/components/admin/AdminTable'
import Link from 'next/link'
import styles from '../shared.module.css'

export default async function AdminNythsPage() {
  const admin = createAdminClient()
  const { data: nyths } = await admin.from('nyths').select('*').order('is_player_character', { ascending: false }).order('name')

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'manifestation_name', label: 'Manifestation' },
    { key: 'is_player_character', label: 'Type', type: 'player_type' as const },
    { key: 'current_condition', label: 'Condition' },
    { key: 'visibility', label: 'Visibility', type: 'visibility' as const },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Nyths</h1>
        <Link href="/admin/nyths/new" className={styles.newBtn}>+ New Nyth</Link>
      </div>
      <AdminTable rows={(nyths ?? []) as unknown as Record<string, unknown>[]} columns={columns} editBasePath="/admin/nyths" />
    </div>
  )
}
