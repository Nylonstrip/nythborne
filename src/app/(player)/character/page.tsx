'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPlayerClient } from '@/lib/supabase'
import PageHeader from '@/components/ui/PageHeader'
import styles from './character.module.css'

interface CharacterData {
  id: string
  name: string
  wish: string | null
  manifestation_name: string | null
  manifestation_description: string | null
  background: string | null
  personality_basis: string | null
  current_condition: string | null
  level: number
  mental: number
  resonance: number
  alignment: number
  unspent_points: number
  traits: string[]
  approval_status: string
}

interface CampaignData {
  id: string
  name: string
  description: string | null
}

interface SessionData {
  id: string
  session_number: number
  title: string | null
  live_notes: string | null
}

const ATTUNEMENTS: { key: 'mental' | 'resonance' | 'alignment'; label: string; desc: string }[] = [
  { key: 'mental', label: 'Mental', desc: 'Deck capacity, clarity of mind' },
  { key: 'resonance', label: 'Resonance', desc: 'Nythilian concentration' },
  { key: 'alignment', label: 'Alignment', desc: 'Attunement to the All Mother' },
]

export default function CharacterPage() {
  const [character, setCharacter] = useState<CharacterData | null>(null)
  const [hasProfile, setHasProfile] = useState(false)
  const [campaign, setCampaign] = useState<CampaignData | null>(null)
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [connected, setConnected] = useState(false)
  const [allocating, setAllocating] = useState(false)

  const fetchAll = useCallback(async () => {
    const supabase = createPlayerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('player_profiles')
      .select('character_id, characters(*)')
      .eq('user_id', user.id)
      .single()

    setHasProfile(true)
    const char = (profile?.characters as unknown as CharacterData) ?? null
    setCharacter(char)

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, description')
      .eq('is_active', true)
      .limit(1)
    const activeCampaign = campaigns?.[0] ?? null
    setCampaign(activeCampaign)

    if (activeCampaign) {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, session_number, title, live_notes')
        .eq('campaign_id', activeCampaign.id)
        .order('session_number', { ascending: false })
        .limit(1)
      setCurrentSession(sessions?.[0] ?? null)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Realtime: character row, plus campaign/session context, once we know the character id
  useEffect(() => {
    const supabase = createPlayerClient()
    const channel = supabase.channel('character-live')

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => fetchAll())
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => fetchAll())

    if (character?.id) {
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${character.id}` },
        () => fetchAll()
      )
    }

    channel.subscribe(status => setConnected(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [character?.id, fetchAll])

  async function allocatePoint(stat: 'mental' | 'resonance' | 'alignment') {
    if (!character || character.unspent_points <= 0 || character[stat] >= 5) return
    setAllocating(true)
    const supabase = createPlayerClient()
    const { data, error } = await supabase
      .from('characters')
      .update({
        [stat]: character[stat] + 1,
        unspent_points: character.unspent_points - 1,
      })
      .eq('id', character.id)
      .select()
      .single()

    if (!error && data) {
      setCharacter(data as unknown as CharacterData)
    }
    setAllocating(false)
  }

  if (!hasProfile) {
    return <div className={styles.page}><p className={styles.empty}>Loading...</p></div>
  }

  if (!character) {
    return (
      <div className={styles.page}>
        <PageHeader eyebrow="Astraea" title="Character" description="" />
        <div className={styles.empty}>
          <p>Your character has not been assigned yet. The All Mother is still writing your story.</p>
          <a href="/characters/new" className={styles.actionBtn}>Create Your Character</a>
        </div>
      </div>
    )
  }

  if (character.approval_status === 'pending') {
    return (
      <div className={styles.page}>
        <PageHeader eyebrow="Astraea" title={character.name} description="" />
        <div className={styles.empty}>
          <p>Your character &quot;{character.name}&quot; is awaiting the GM&apos;s approval.</p>
        </div>
      </div>
    )
  }

  if (character.approval_status === 'rejected') {
    return (
      <div className={styles.page}>
        <PageHeader eyebrow="Astraea" title="Character" description="" />
        <div className={styles.empty}>
          <p>Your last submission wasn&apos;t approved. You&apos;re free to try again.</p>
          <a href="/characters/new" className={styles.actionBtn}>Submit a New Character</a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader eyebrow="Astraea" title={character.name} description={character.wish ?? ''} />

      {connected && (
        <p className={styles.liveTag}>⬤ Live — updates automatically</p>
      )}

      <div className={styles.layout}>
        {/* Main sheet */}
        <div className={styles.sheet}>
          <section className={styles.panel}>
            <span className={styles.panelLabel}>Level {character.level}</span>
            {character.unspent_points > 0 && (
              <p className={styles.pointsNotice}>
                You have {character.unspent_points} unspent point{character.unspent_points > 1 ? 's' : ''} to allocate.
              </p>
            )}

            {ATTUNEMENTS.map(a => (
              <div key={a.key} className={styles.statRow}>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>{a.label}</span>
                  <span className={styles.statDesc}>{a.desc}</span>
                </div>
                <div className={styles.statBar}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} className={n <= character[a.key] ? styles.pipFilled : styles.pipEmpty} />
                  ))}
                </div>
                {character.unspent_points > 0 && character[a.key] < 5 && (
                  <button
                    className={styles.allocateBtn}
                    onClick={() => allocatePoint(a.key)}
                    disabled={allocating}
                  >
                    +1
                  </button>
                )}
              </div>
            ))}
          </section>

          {character.traits?.length > 0 && (
            <section className={styles.panel}>
              <span className={styles.panelLabel}>Traits</span>
              <ul className={styles.traitList}>
                {character.traits.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </section>
          )}

          {character.manifestation_name && (
            <section className={styles.panel}>
              <span className={styles.panelLabel}>Manifestation</span>
              <p className={styles.bodyText}>
                {character.manifestation_name}
                {character.manifestation_description && ` — ${character.manifestation_description}`}
              </p>
            </section>
          )}

          {character.background && (
            <section className={styles.panel}>
              <span className={styles.panelLabel}>Background</span>
              <p className={styles.bodyText}>{character.background}</p>
            </section>
          )}

          {character.personality_basis && (
            <section className={styles.panel}>
              <span className={styles.panelLabel}>Personality</span>
              <p className={styles.bodyText}>{character.personality_basis}</p>
            </section>
          )}

          {character.current_condition && (
            <section className={styles.panel}>
              <span className={styles.panelLabel}>Current Condition</span>
              <p className={styles.bodyText}>{character.current_condition}</p>
            </section>
          )}
        </div>

        {/* Sidebar: campaign + session context */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarPanel}>
            <span className={styles.panelLabel}>Campaign</span>
            <p className={styles.bodyText}>{campaign?.name ?? 'No active campaign'}</p>
          </div>

          {currentSession && (
            <div className={styles.sidebarPanel}>
              <span className={styles.panelLabel}>
                Session {currentSession.session_number}
                {currentSession.title && ` — ${currentSession.title}`}
              </span>
              {currentSession.live_notes && (
                <p className={styles.bodyText}>{currentSession.live_notes}</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
