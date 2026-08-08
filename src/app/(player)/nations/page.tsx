export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/ui/PageHeader'
import EntryCard from '@/components/ui/EntryCard'
import styles from './nations.module.css'
import type { Nation } from '@/lib/types'

export default async function NationsPage() {
  const { data: nations } = await supabase
    .from('nations')
    .select('*')
    .order('type')

  const superpowers = nations?.filter((n: Nation) => n.type === 'superpower') ?? []
  const cityState = nations?.filter((n: Nation) => n.type === 'city_state') ?? []
  const others = nations?.filter((n: Nation) => n.type === 'settlement' || n.type === 'pocket_nation') ?? []

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="World of Astraea"
        title="Nations"
        description="Five superpowers shape the political landscape of Astraea. Between them lies the world hub — neutral ground for all who pass through."
        count={`${nations?.length ?? 0} entries`}
      />

      {superpowers.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>The Five Superpowers</h2>
          <div className={styles.grid}>
            {superpowers.map((nation: Nation) => (
              <EntryCard
                key={nation.id}
                href={`/nations/${nation.id}`}
                tag="Superpower"
                name={nation.name}
                description={nation.description ?? 'No description available.'}
                badge={`${nation.relic_count} known relics`}
                accentColor="var(--crystal-3)"
              />
            ))}
          </div>
        </section>
      )}

      {cityState.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>The World Hub</h2>
          <div className={styles.grid}>
            {cityState.map((nation: Nation) => (
              <EntryCard
                key={nation.id}
                href={`/nations/${nation.id}`}
                tag="City-State · Neutral Ground"
                name={nation.name}
                description={nation.description ?? 'No description available.'}
                accentColor="var(--crystal-1)"
              />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Settlements & Pocket Nations</h2>
          <div className={styles.grid}>
            {others.map((nation: Nation) => (
              <EntryCard
                key={nation.id}
                href={`/nations/${nation.id}`}
                tag={nation.type === 'settlement' ? 'Settlement' : 'Pocket Nation'}
                name={nation.name}
                description={nation.description ?? 'No description available.'}
                accentColor="var(--text-dim)"
              />
            ))}
          </div>
        </section>
      )}

      {(!nations || nations.length === 0) && (
        <div className={styles.empty}>
          <p>No nations have been revealed yet.</p>
        </div>
      )}
    </div>
  )
}
