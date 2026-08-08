'use client'
import Link from 'next/link'
import styles from './AdminTable.module.css'

export type ColumnType = 'text' | 'visibility' | 'boolean' | 'relic_number' | 'player_type'

export interface Column {
  key: string
  label: string
  type?: ColumnType
}

interface AdminTableProps {
  rows: Record<string, unknown>[]
  columns: Column[]
  editBasePath: string
}

function renderCell(value: unknown, type: ColumnType = 'text'): React.ReactNode {
  if (value === null || value === undefined) return '—'
  switch (type) {
    case 'visibility':
      return <span className={`${styles.badge} ${styles[String(value)]}`}>{String(value)}</span>
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'player_type':
      return value ? 'Player Character' : 'NPC'
    case 'relic_number':
      return value ? `#${String(value).padStart(3, '0')}` : '—'
    default:
      return String(value)
  }
}

export default function AdminTable({ rows, columns, editBasePath }: AdminTableProps) {
  if (rows.length === 0) {
    return <div className={styles.empty}>No entries yet. Create your first one.</div>
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={styles.th}>{col.label}</th>
            ))}
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id as string} className={styles.tr}>
              {columns.map(col => (
                <td key={col.key} className={styles.td}>
                  {renderCell(row[col.key], col.type)}
                </td>
              ))}
              <td className={styles.td}>
                <Link href={`${editBasePath}/${row.id}`} className={styles.editBtn}>
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
