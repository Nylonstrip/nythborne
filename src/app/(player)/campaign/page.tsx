export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/ui/PageHeader'
import styles from './campaign.module.css'
import type { Campaign, Session } from '@/lib/types'

export default async function CampaignPage() {
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .limit(1)

  const activeCampaign: Campaign | null = campaigns?.[0] ?? null

  const { data: sessions } = activeCampaign
    ? await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', activeCampaign.id)
        .order('session_number', { ascending: false })
    : { data: null }

  const currentSession: Session | null = sessions?.[0] ?? null
  const pastSessions = sessions?.slice(1) ?? []

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Nythborne Campaign"
        title={activeCampaign?.name ?? 'Campaign'}
        description={activeCampaign?.description ?? 'Follow along as the story unfolds.'}
      />

      {!activeCampaign && (
        <div className={styles.empty}>
          <p>No active campaign yet. The GM will set one up before your first session.</p>
        </div>
      )}

      {currentSession && (
        <section className={styles.currentSession}>
          <div className={styles.sessionHeader}>
            <span className={styles.sessionTag}>Current Session</span>
            <h2 className={styles.sessionTitle}>
              Session {currentSession.session_number}
              {currentSession.title && ` — ${currentSession.title}`}
            </h2>
          </div>

          {currentSession.live_notes && (
            <div className={styles.liveNotes}>
              <span className={styles.liveLabel}>⬤ Live Notes</span>
              <p>{currentSession.live_notes}</p>
            </div>
          )}

          {currentSession.summary && (
            <div className={styles.summary}>
              <span className={styles.summaryLabel}>Session Summary</span>
              <p>{currentSession.summary}</p>
            </div>
          )}
        </section>
      )}

      {pastSessions.length > 0 && (
        <section className={styles.pastSessions}>
          <h2 className={styles.sectionTitle}>Session History</h2>
          <div className={styles.sessionList}>
            {pastSessions.map((session: Session) => (
              <div key={session.id} className={styles.pastSession}>
                <span className={styles.pastSessionNum}>Session {session.session_number}</span>
                {session.title && <h3 className={styles.pastSessionTitle}>{session.title}</h3>}
                {session.summary && <p className={styles.pastSessionSummary}>{session.summary}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
