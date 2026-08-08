export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/ui/PageHeader'
import EntryCard from '@/components/ui/EntryCard'
import styles from './relics.module.css'
import type { Relic } from '@/lib/types'

export default async function RelicsPage() {
  const { data: relics, count } = await supabase
    .from('relics')
    .select('*', { count: 'exact' })
    .order('relic_number', { ascending: true })

  const discovered = relics?.filter((r: Relic) => r.is_discovered) ?? []
  const discoveredCount = discovered.length

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="World of Astraea"
        title="The Relic Registry"
        description="Three hundred unique objects of power exist somewhere in Astraea. Each is one of a kind. Each requires a power source to use. Most remain undiscovered."
        count={`${count ?? 0} of 300 revealed`}
      />

      {/* Discovery bar */}
      <div className={styles.registryBar}>
        <div className={styles.barInfo}>
          <span className={styles.barLabel}>Global Discovery Progress</span>
          <span className={styles.barCount}>{discoveredCount} / 300 discovered</span>
        </div>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            style={{ width: `${Math.min((discoveredCount / 300) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Relics grid */}
      {relics && relics.length > 0 ? (
        <div className={styles.grid}>
          {relics.map((relic: Relic) => (
            <EntryCard
              key={relic.id}
              href={`/relics/${relic.id}`}
              tag={relic.relic_number ? `Relic #${String(relic.relic_number).padStart(3, '0')}` : 'Relic'}
              name={relic.name}
              description={relic.description ?? relic.ability}
              badge={relic.is_discovered ? relic.current_owner ? `Held by ${relic.current_owner}` : 'Location Unknown' : 'Undiscovered'}
              accentColor="var(--relic)"
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>No relics have been revealed to players yet.</p>
          <p className={styles.emptyNote}>They exist. They are out there. You just don&apos;t know where.</p>
        </div>
      )}
    </div>
  )
}
