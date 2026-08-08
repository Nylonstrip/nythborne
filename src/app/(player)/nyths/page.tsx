export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/ui/PageHeader'
import EntryCard from '@/components/ui/EntryCard'
import styles from './nyths.module.css'
import type { Character as Nyth } from '@/lib/types'

export default async function NythsPage() {
  const { data: nyths } = await supabase
    .from('nyths')
    .select('*')
    .order('is_player_character', { ascending: false })

  const players = nyths?.filter((n: Nyth) => n.is_player_character) ?? []
  const npcs = nyths?.filter((n: Nyth) => !n.is_player_character) ?? []

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="World of Astraea"
        title="Nyths"
        description="Those who carry dangerous amounts of nythilian in their blood — and survived a moment of near-death to manifest something uniquely their own."
        count={`${nyths?.length ?? 0} known`}
      />

      {/* System callout */}
      <div className={styles.callout}>
        <div className={styles.calloutInner}>
          <span className={styles.calloutLabel}>Nythilian System</span>
          <p className={styles.calloutText}>
            Every Nyth&apos;s ability is crystalline in nature, shaped by their wish at the moment of near-death,
            and reflects their personality. No two manifestations are alike. Overuse causes anemia and
            physical deterioration — power has a cost.
          </p>
        </div>
      </div>

      {players.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Player Characters</h2>
          <div className={styles.grid}>
            {players.map((nyth: Nyth) => (
              <EntryCard
                key={nyth.id}
                href={`/nyths/${nyth.id}`}
                tag="Nyth · Player Character"
                name={nyth.name}
                description={`Manifestation: ${nyth.manifestation_name}. ${nyth.manifestation_description ?? ''}`}
                badge="Nythilian Carrier"
                accentColor="var(--crystal-1)"
              />
            ))}
          </div>
        </section>
      )}

      {npcs.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Known Nyths</h2>
          <div className={styles.grid}>
            {npcs.map((nyth: Nyth) => (
              <EntryCard
                key={nyth.id}
                href={`/nyths/${nyth.id}`}
                tag="Nyth · NPC"
                name={nyth.name}
                description={nyth.manifestation_description ?? `Manifestation: ${nyth.manifestation_name}`}
                badge={nyth.current_condition ?? 'Condition Unknown'}
                accentColor="var(--crystal-2)"
              />
            ))}
          </div>
        </section>
      )}

      {(!nyths || nyths.length === 0) && (
        <div className={styles.empty}>
          <p>No Nyths have been revealed yet.</p>
        </div>
      )}
    </div>
  )
}
