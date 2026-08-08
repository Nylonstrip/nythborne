export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import AdminTable from '@/components/admin/AdminTable'
import Link from 'next/link'
import styles from '../shared.module.css'

export default async function AdminRulesPage() {
  const admin = createAdminClient()
  const { data: rules } = await admin.from('rules').select('*').order('category').order('order_index')

  const columns = [
    { key: 'category', label: 'Category' },
    { key: 'title', label: 'Title' },
    { key: 'order_index', label: 'Order' },
    { key: 'visibility', label: 'Visibility', type: 'visibility' as const },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Rules</h1>
        <Link href="/admin/rules/new" className={styles.newBtn}>+ New Rule</Link>
      </div>
      <AdminTable rows={(rules ?? []) as unknown as Record<string, unknown>[]} columns={columns} editBasePath="/admin/rules" />
    </div>
  )
}
