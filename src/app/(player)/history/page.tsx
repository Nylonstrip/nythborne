export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/ui/PageHeader'
import styles from './history.module.css'
import type { TimelineEvent } from '@/lib/types'

export default async function HistoryPage() {
  const { data: events } = await supabase
    .from('timeline_events')
    .select('*')
    .order('order_index', { ascending: true })

  // Group by era
  const eras: Record<string, TimelineEvent[]> = {}
  events?.forEach((event: TimelineEvent) => {
    const era = event.era ?? 'Unknown Era'
    if (!eras[era]) eras[era] = []
    eras[era].push(event)
  })

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="World of Astraea"
        title="History"
        description="There is one true timeline. Religions formed around what little was understood. Not all of it has been revealed to you."
        count={`${events?.length ?? 0} events revealed`}
      />

      {Object.keys(eras).length > 0 ? (
        Object.entries(eras).map(([era, eraEvents]) => (
          <section key={era} className={styles.eraSection}>
            <h2 className={styles.eraTitle}>{era}</h2>
            <div className={styles.timeline}>
              {eraEvents.map((event: TimelineEvent) => (
                <div key={event.id} className={styles.event}>
                  <div className={styles.spine}>
                    <div className={styles.spineDiamond} />
                    <div className={styles.spineLine} />
                  </div>
                  <div className={styles.eventContent}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    {event.description && (
                      <p className={styles.eventDesc}>{event.description}</p>
                    )}
                    {event.significance && (
                      <p className={styles.eventSignificance}>
                        <span>Significance —</span> {event.significance}
                      </p>
                    )}
                    {event.religious_interpretation && (
                      <div className={styles.religiousNote}>
                        <span className={styles.religiousLabel}>Religious Interpretation</span>
                        <p>{event.religious_interpretation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className={styles.empty}>
          <p>No history has been revealed yet.</p>
          <p className={styles.emptyNote}>History exists. It happened. You&apos;ll learn it in time.</p>
        </div>
      )}
    </div>
  )
}
