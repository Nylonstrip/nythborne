export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import AdminTable from '@/components/admin/AdminTable'
import Link from 'next/link'
import styles from '../shared.module.css'

export default async function AdminTimelinePage() {
  const admin = createAdminClient()
  const { data: events } = await admin.from('timeline_events').select('*').order('order_index')

  const columns = [
    { key: 'order_index', label: 'Order' },
    { key: 'era', label: 'Era' },
    { key: 'title', label: 'Title' },
    { key: 'visibility', label: 'Visibility', type: 'visibility' as const },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Timeline</h1>
        <Link href="/admin/timeline/new" className={styles.newBtn}>+ New Event</Link>
      </div>
      <AdminTable rows={(events ?? []) as unknown as Record<string, unknown>[]} columns={columns} editBasePath="/admin/timeline" />
    </div>
  )
}
