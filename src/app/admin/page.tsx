export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import styles from './dashboard.module.css'
import Link from 'next/link'

export default async function AdminDashboard() {
  const admin = createAdminClient()

  const [
    { count: nationCount },
    { count: nythCount },
    { count: relicCount },
    { count: discoveredRelics },
    { count: timelineCount },
    { count: ruleCount },
    { count: hiddenCount },
  ] = await Promise.all([
    admin.from('nations').select('*', { count: 'exact', head: true }),
    admin.from('characters').select('*', { count: 'exact', head: true }),
    admin.from('relics').select('*', { count: 'exact', head: true }),
    admin.from('relics').select('*', { count: 'exact', head: true }).eq('is_discovered', true),
    admin.from('timeline_events').select('*', { count: 'exact', head: true }),
    admin.from('rules').select('*', { count: 'exact', head: true }),
    admin.from('timeline_events').select('*', { count: 'exact', head: true }).eq('visibility', 'hidden'),
  ])

  const SECTIONS = [
    { label: 'Nations',    count: nationCount   ?? 0, href: '/admin/nations',    color: 'var(--gm-text)',  desc: 'Superpowers, city-state, settlements' },
    { label: 'Characters', count: nythCount     ?? 0, href: '/admin/characters', color: 'var(--gm-gold)',  desc: 'Player chars and NPCs' },
    { label: 'Relics',     count: relicCount    ?? 0, href: '/admin/relics',     color: 'var(--gm-ember)', desc: `${discoveredRelics ?? 0} of 187 discovered` },
    { label: 'Timeline',   count: timelineCount ?? 0, href: '/admin/timeline',   color: 'var(--gm-gold)',  desc: `${hiddenCount ?? 0} events still hidden` },
    { label: 'Rules',      count: ruleCount     ?? 0, href: '/admin/rules',      color: 'var(--gm-text)',  desc: 'Nyth, Relic, Skill mechanics' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.headerEyebrow}>All Mother Interface</p>
        <h1 className={styles.title}>The Observatory</h1>
        <p className={styles.subtitle}>Astraea turns. The plates hold. For now.</p>
      </div>

      {/* Stat cards */}
      <div className={styles.statGrid}>
        {SECTIONS.map(({ label, count, href, color, desc }) => (
          <Link key={href} href={href} className={styles.statCard} style={{ '--accent': color } as React.CSSProperties}>
            <span className={styles.statCount}>{count}</span>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statDesc}>{desc}</span>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          {[
            { href: '/admin/nations/new',    label: 'Add Nation' },
            { href: '/admin/characters/new', label: 'Add Character' },
            { href: '/admin/relics/new',     label: 'Add Relic' },
            { href: '/admin/timeline/new',   label: 'Add Timeline Event' },
            { href: '/admin/rules/new',      label: 'Add Rule' },
            { href: '/admin/campaign',       label: 'Manage Campaign' },
            { href: '/admin/connections',    label: 'View Connections' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className={styles.actionBtn}>
              + {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className={styles.infoBox}>
        <span className={styles.infoLabel}>Visibility System</span>
        <p className={styles.infoText}>
          Every entry has three visibility states: <strong>Hidden</strong> (only you can see it),{' '}
          <strong>Revealed</strong> (players can see it was revealed during a specific session), and{' '}
          <strong>Public</strong> (always visible to players, like general world knowledge).
          Use Hidden for lore you&apos;re not ready to share yet.
        </p>
      </div>
    </div>
  )
}
