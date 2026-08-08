export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import styles from './world.module.css'

export default async function WorldPage() {
  // Fetch live counts for the stat display
  const [{ count: relicCount }, { count: nythCount }, { count: nationCount }] = await Promise.all([
    supabase.from('relics').select('*', { count: 'exact', head: true }),
    supabase.from('characters').select('*', { count: 'exact', head: true }),
    supabase.from('nations').select('*', { count: 'exact', head: true }),
  ])

  const discoveredRelics = await supabase
    .from('relics')
    .select('*', { count: 'exact', head: true })
    .eq('is_discovered', true)

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>The World of Astraea</p>
          <h1 className={styles.title}>
            Where <span>Crystal</span><br />Meets Desperation
          </h1>
          <p className={styles.desc}>
            A world of orbital plates and world trains, where those who survive death
            manifest something no one else can possess — and where 300 objects of
            impossible power scatter the known nations.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{nationCount ?? 0}</span>
              <span className={styles.statLabel}>Nations</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>300</span>
              <span className={styles.statLabel}>Relics</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>4</span>
              <span className={styles.statLabel}>Dungeons</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{nythCount ?? 0}</span>
              <span className={styles.statLabel}>Known Nyths</span>
            </div>
          </div>
        </div>

        {/* Crystal visual */}
        <div className={styles.visual}>
          <div className={styles.crystalCluster}>
            <div className={styles.crystalGlow} />
            <div className={`${styles.crystal} ${styles.crystalLeft}`} />
            <div className={`${styles.crystal} ${styles.crystalRight}`} />
            <div className={`${styles.crystal} ${styles.crystalSmall1}`} />
            <div className={`${styles.crystal} ${styles.crystalSmall2}`} />
            <div className={`${styles.crystal} ${styles.crystalMain}`} />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>Navigate the World</span>
        <div className={styles.dividerLine} />
      </div>

      {/* Quick nav cards */}
      <section className={styles.quickNav}>
        {[
          { href: '/nations', label: 'Nations', desc: 'The five superpowers, the world hub, and scattered settlements of Astraea.', color: 'var(--crystal-3)' },
          { href: '/characters', label: 'Characters', desc: 'The characters of Astraea — Nyths, NPCs, CryBrids, and more.', color: 'var(--crystal-1)' },
          { href: '/relics', label: 'Relics', desc: 'Three hundred unique objects of power. Most remain undiscovered.', color: 'var(--relic)' },
          { href: '/history', label: 'History', desc: 'One true timeline. Not all of it has been revealed to you yet.', color: 'var(--crystal-2)' },
          { href: '/rules', label: 'Rules', desc: 'How Nyth abilities work, how Relics are used, and the skill system.', color: 'var(--crystal-1)' },
          { href: '/campaign', label: 'Campaign', desc: 'Current session notes, live updates, and session history.', color: 'var(--crystal-3)' },
        ].map(({ href, label, desc, color }) => (
          <Link key={href} href={href} className={styles.navCard} style={{ '--accent': color } as React.CSSProperties}>
            <span className={styles.navCardLabel}>{label}</span>
            <p className={styles.navCardDesc}>{desc}</p>
            <span className={styles.navCardArrow}>→</span>
          </Link>
        ))}
      </section>

      {/* Relic progress */}
      <section className={styles.relicBar}>
        <span className={styles.relicLabel}>Relic Registry — Global Discovery</span>
        <div className={styles.relicTrack}>
          <div
            className={styles.relicFill}
            style={{ width: `${Math.min(((discoveredRelics.count ?? 0) / 300) * 100, 100)}%` }}
          />
        </div>
        <span className={styles.relicCount}>{discoveredRelics.count ?? 0} / 300</span>
      </section>

      <footer className={styles.footer}>
        <span>Nythborne · World of Astraea</span>
        <span className={styles.footerQuote}>All history contains one truth. Not all truth is known.</span>
      </footer>
    </div>
  )
}
