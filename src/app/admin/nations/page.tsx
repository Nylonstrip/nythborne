export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import AdminTable from '@/components/admin/AdminTable'
import Link from 'next/link'
import styles from '../shared.module.css'

export default async function AdminNationsPage() {
  const admin = createAdminClient()
  const { data: nations } = await admin.from('nations').select('*').order('type').order('name')

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'relic_count', label: 'Relics' },
    { key: 'visibility', label: 'Visibility', type: 'visibility' as const },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Nations</h1>
        <Link href="/admin/nations/new" className={styles.newBtn}>+ New Nation</Link>
      </div>
      <AdminTable rows={(nations ?? []) as unknown as Record<string, unknown>[]} columns={columns} editBasePath="/admin/nations" />
    </div>
  )
}
