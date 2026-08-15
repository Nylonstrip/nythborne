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
  health: number
  max_health: number
  mana: number
  max_mana: number
}

interface Participant {
  id: string
  initiative_roll: number | null
  initiative_total: number | null
  is_current_turn: boolean
  characters: CharacterMini
}

interface ActionOption {
  id: string
  name: string
  description: string | null
}

interface MyRequest {
  id: string
  status: string
  outcome_description: string | null
  created_at: string
  actions: { name: string }
}

export default function PlayPage() {
  const [campaign, setCampaign] = useState<{ id: string; name: string } | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [connected, setConnected] = useState(false)
  const [myCharacterId, setMyCharacterId] = useState<string | null>(null)
  const [actionOptions, setActionOptions] = useState<ActionOption[]>([])
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedTarget, setSelectedTarget] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [myRequests, setMyRequests] = useState<MyRequest[]>([])

  const fetchAll = useCallback(async () => {
    const supabase = createPlayerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
    const activeCampaign = campaigns?.[0] ?? null
    setCampaign(activeCampaign)

    let charId: string | null = null
    if (user) {
      const { data: profile } = await supabase
        .from('player_profiles')
        .select('character_id')
        .eq('user_id', user.id)
        .single()
      charId = profile?.character_id ?? null
      setMyCharacterId(charId)
    }

    if (activeCampaign) {
      const { data } = await supabase
        .from('encounter_participants')
        .select('id, initiative_roll, initiative_total, is_current_turn, characters(id, name, avatar_url, level, mental, resonance, alignment, health, max_health, mana, max_mana)')
        .eq('campaign_id', activeCampaign.id)
        .order('initiative_total', { ascending: false, nullsFirst: false })

      const visible = ((data as unknown as Participant[]) ?? []).filter(p => p.characters)
      setParticipants(visible)

      if (charId) {
        const { data: actionsData } = await supabase
          .from('actions')
          .select('id, name, description')
          .or(`character_id.is.null,character_id.eq.${charId}`)
        setActionOptions(actionsData ?? [])

        const { data: reqData } = await supabase
          .from('action_requests')
          .select('id, status, outcome_description, created_at, actions(name)')
          .eq('campaign_id', activeCampaign.id)
          .order('created_at', { ascending: false })
          .limit(5)
        setMyRequests((reqData as unknown as MyRequest[]) ?? [])
      }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'action_requests' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, () => fetchAll())
      .subscribe(status => setConnected(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAll])

  async function submitAction() {
    if (!campaign || !myParticipant || !selectedAction || !selectedTarget) return
    setSubmitting(true)
    setSubmitMsg('')
    const supabase = createPlayerClient()
    const { error } = await supabase.from('action_requests').insert({
      campaign_id: campaign.id,
      participant_id: myParticipant.id,
      action_id: selectedAction,
      target_participant_id: selectedTarget,
    })
    if (error) {
      setSubmitMsg(error.message)
    } else {
      setSubmitMsg('Action submitted — waiting on the GM.')
      setSelectedAction('')
      setSelectedTarget('')
      fetchAll()
    }
    setSubmitting(false)
  }

  const current = participants.find(p => p.is_current_turn)
  const myParticipant = participants.find(p => p.characters.id === myCharacterId)
  const isMyTurn = !!myParticipant && myParticipant.is_current_turn

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
            <p>HP {current.characters.health}/{current.characters.max_health} — MP {current.characters.mana}/{current.characters.max_mana}</p>
          </div>
        </div>
      ) : (
        <p className={styles.empty}>{participants.length ? "Waiting for the GM to start." : 'No encounter in progress.'}</p>
      )}

      {isMyTurn && (
        <div className={styles.actionPanel}>
          <span className={styles.spotlightTag}>It&apos;s Your Turn</span>
          <div className={styles.actionRow}>
            <select value={selectedAction} onChange={e => setSelectedAction(e.target.value)} className={styles.actionSelect}>
              <option value="">Choose an action...</option>
              {actionOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={selectedTarget} onChange={e => setSelectedTarget(e.target.value)} className={styles.actionSelect}>
              <option value="">Choose a target...</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  {p.characters.id === myCharacterId ? `${p.characters.name} (yourself)` : p.characters.name}
                </option>
              ))}
            </select>
            <button
              className={styles.actionBtn}
              onClick={submitAction}
              disabled={submitting || !selectedAction || !selectedTarget}
            >
              {submitting ? 'Submitting...' : 'Submit Action'}
            </button>
          </div>
          {submitMsg && <p className={styles.actionMsg}>{submitMsg}</p>}
        </div>
      )}

      {myRequests.length > 0 && (
        <div className={styles.requestLog}>
          <span className={styles.spotlightTag}>Recent Actions</span>
          {myRequests.map(r => (
            <div key={r.id} className={styles.requestRow}>
              <span>
                {r.actions.name}
                {r.outcome_description && <span style={{ opacity: 0.7 }}> — {r.outcome_description}</span>}
              </span>
              <span className={`${styles.statusTag} ${styles['status_' + r.status]}`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}

      {participants.length > 0 && (
        <div className={styles.rosterList}>
          {participants.map(p => (
            <div key={p.id} className={`${styles.rosterRow} ${p.is_current_turn ? styles.rosterRowActive : ''} ${p.characters.id === myCharacterId ? styles.rosterRowMine : ''}`}>
              {p.characters.avatar_url ? (
                <img src={p.characters.avatar_url} alt={p.characters.name} className={styles.rosterImg} />
              ) : (
                <div className={styles.rosterImgPlaceholder} />
              )}
              <span className={styles.rosterName}>
                {p.characters.name}
                {p.characters.id === myCharacterId && <span className={styles.youBadge}>YOU</span>}
              </span>
              <span className={styles.rosterMeta}>
                HP {p.characters.health}/{p.characters.max_health} · MP {p.characters.mana}/{p.characters.max_mana}
              </span>
              <span className={styles.rosterMeta}>{p.initiative_total ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
