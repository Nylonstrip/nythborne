export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import AdminTable from '@/components/admin/AdminTable'
import Link from 'next/link'
import styles from '../shared.module.css'

export default async function AdminRelicsPage() {
  const admin = createAdminClient()
  const { data: relics } = await admin.from('relics').select('*').order('relic_number', { ascending: true })

  const columns = [
    { key: 'relic_number', label: '#', type: 'relic_number' as const },
    { key: 'name', label: 'Name' },
    { key: 'power_source', label: 'Power Source' },
    { key: 'current_owner', label: 'Owner' },
    { key: 'is_discovered', label: 'Discovered', type: 'boolean' as const },
    { key: 'visibility', label: 'Visibility', type: 'visibility' as const },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Relics ({relics?.length ?? 0} / 300)</h1>
        <Link href="/admin/relics/new" className={styles.newBtn}>+ New Relic</Link>
      </div>
      <AdminTable rows={(relics ?? []) as unknown as Record<string, unknown>[]} columns={columns} editBasePath="/admin/relics" />
    </div>
  )
}
