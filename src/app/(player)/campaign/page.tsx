'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPlayerClient } from '@/lib/supabase'
import PageHeader from '@/components/ui/PageHeader'
import styles from './campaign.module.css'
import type { Campaign, Session } from '@/lib/types'

export default function CampaignPage() {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [connected, setConnected] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createPlayerClient()

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true)
      .limit(1)

    const campaign: Campaign | null = campaigns?.[0] ?? null
    setActiveCampaign(campaign)

    if (campaign) {
      const { data: sessionRows } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('session_number', { ascending: false })
      setSessions(sessionRows ?? [])
    } else {
      setSessions([])
    }
  }, [])

  useEffect(() => {
    fetchData()

    const supabase = createPlayerClient()
    const channel = supabase
      .channel('campaign-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchData()
      })
      .subscribe(status => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  const currentSession: Session | null = sessions[0] ?? null
  const pastSessions = sessions.slice(1)

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Nythborne Campaign"
        title={activeCampaign?.name ?? 'Campaign'}
        description={activeCampaign?.description ?? 'Follow along as the story unfolds.'}
      />

      {connected && (
        <p style={{ fontSize: '11px', color: 'var(--crystal-3)', letterSpacing: '0.1em', marginBottom: '16px' }}>
          ⬤ Live — updates automatically, no refresh needed
        </p>
      )}

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
