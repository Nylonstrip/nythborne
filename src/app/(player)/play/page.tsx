'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPlayerClient } from '@/lib/supabase'
import PageHeader from '@/components/ui/PageHeader'
import styles from './play.module.css'

interface CharacterMini {
  id: string
  name: string
  avatar_url: string | null
  level: number
  mental: number
  resonance: number
  alignment: number
}

interface Participant {
  id: string
  initiative_roll: number | null
  initiative_total: number | null
  is_current_turn: boolean
  characters: CharacterMini
}

export default function PlayPage() {
  const [campaign, setCampaign] = useState<{ id: string; name: string } | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [connected, setConnected] = useState(false)

  const fetchAll = useCallback(async () => {
    const supabase = createPlayerClient()

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
    const activeCampaign = campaigns?.[0] ?? null
    setCampaign(activeCampaign)

    if (activeCampaign) {
      const { data } = await supabase
        .from('encounter_participants')
        .select('id, initiative_roll, initiative_total, is_current_turn, characters(id, name, avatar_url, level, mental, resonance, alignment)')
        .eq('campaign_id', activeCampaign.id)
        .order('initiative_total', { ascending: false, nullsFirst: false })
      setParticipants((data as unknown as Participant[]) ?? [])
    } else {
      setParticipants([])
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const supabase = createPlayerClient()
    const channel = supabase
      .channel('play-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'encounter_participants' }, () => fetchAll())
      .subscribe(status => setConnected(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAll])

  const current = participants.find(p => p.is_current_turn)

  return (
    <div className={styles.page}>
      <PageHeader eyebrow="Astraea" title="Play" description={campaign?.name ?? 'No active campaign'} />

      {connected && <p className={styles.liveTag}>⬤ Live</p>}

      {current ? (
        <div className={styles.spotlight}>
          {current.characters.avatar_url ? (
            <img src={current.characters.avatar_url} alt={current.characters.name} className={styles.spotlightImg} />
          ) : (
            <div className={styles.spotlightPlaceholder}>No image</div>
          )}
          <div>
            <span className={styles.spotlightTag}>Current Turn</span>
            <h2 className={styles.spotlightName}>{current.characters.name}</h2>
            <p>
              Level {current.characters.level} — Mental {current.characters.mental}/5,
              {' '}Resonance {current.characters.resonance}/5, Alignment {current.characters.alignment}/5
            </p>
          </div>
        </div>
      ) : (
        <p className={styles.empty}>{participants.length ? "Waiting for the GM to start." : 'No encounter in progress.'}</p>
      )}

      {participants.length > 0 && (
        <div className={styles.rosterList}>
          {participants.map(p => (
            <div key={p.id} className={`${styles.rosterRow} ${p.is_current_turn ? styles.rosterRowActive : ''}`}>
              {p.characters.avatar_url ? (
                <img src={p.characters.avatar_url} alt={p.characters.name} className={styles.rosterImg} />
              ) : (
                <div className={styles.rosterImgPlaceholder} />
              )}
              <span className={styles.rosterName}>{p.characters.name}</span>
              <span className={styles.rosterMeta}>{p.initiative_total ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
