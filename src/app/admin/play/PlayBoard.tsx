'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from '@/app/admin/shared.module.css'
import playStyles from './play.module.css'

interface CharacterMini {
  id: string
  name: string
  avatar_url: string | null
  level?: number
  mental?: number
  resonance?: number
  alignment?: number
  is_player_character?: boolean
}

interface Participant {
  id: string
  campaign_id: string
  character_id: string
  initiative_modifier: number
  initiative_roll: number | null
  initiative_total: number | null
  is_current_turn: boolean
  characters: CharacterMini
}

interface ActionRequest {
  id: string
  status: string
  created_at: string
  actions: { name: string; description: string | null }
  encounter_participants: { characters: { name: string } }
  target: { characters: { name: string } } | null
}

export default function PlayBoard({ campaign }: { campaign: { id: string; name: string } | null }) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [available, setAvailable] = useState<CharacterMini[]>([])
  const [selectedToAdd, setSelectedToAdd] = useState('')
  const [addError, setAddError] = useState('')
  const [busy, setBusy] = useState(false)
  const [requests, setRequests] = useState<ActionRequest[]>([])

  const fetchParticipants = useCallback(async () => {
    if (!campaign) return
    const res = await fetch(`/api/admin/encounter?campaign_id=${campaign.id}`)
    const d = await res.json()
    setParticipants(d.participants ?? [])
  }, [campaign])

  const fetchAvailable = useCallback(async () => {
    if (!campaign) return
    const res = await fetch(`/api/admin/encounter/available?campaign_id=${campaign.id}`)
    const d = await res.json()
    setAvailable(d.characters ?? [])
  }, [campaign])

  const fetchRequests = useCallback(async () => {
    if (!campaign) return
    const res = await fetch(`/api/admin/action-requests?campaign_id=${campaign.id}`)
    const d = await res.json()
    setRequests(d.requests ?? [])
  }, [campaign])

  useEffect(() => {
    fetchParticipants()
    fetchAvailable()
    fetchRequests()
    // Polling, not true realtime — GM auth doesn't carry a Supabase session,
    // so RLS-gated realtime channels aren't usable here yet.
    const interval = setInterval(fetchRequests, 5000)
    return () => clearInterval(interval)
  }, [fetchParticipants, fetchAvailable, fetchRequests])

  async function addToEncounter() {
    if (!campaign || !selectedToAdd) return
    setBusy(true)
    setAddError('')
    const res = await fetch('/api/admin/encounter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaign.id, character_id: selectedToAdd }),
    })
    if (res.ok) {
      setSelectedToAdd('')
      await fetchParticipants()
      await fetchAvailable()
    } else {
      const d = await res.json()
      setAddError(d.error ?? 'Something went wrong.')
    }
    setBusy(false)
  }

  async function removeParticipant(id: string) {
    setBusy(true)
    await fetch(`/api/admin/encounter/${id}`, { method: 'DELETE' })
    await fetchParticipants()
    await fetchAvailable()
    setBusy(false)
  }

  async function rollInitiative(id: string) {
    setBusy(true)
    await fetch(`/api/admin/encounter/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'roll' }),
    })
    await fetchParticipants()
    setBusy(false)
  }

  async function rollAll() {
    setBusy(true)
    for (const p of participants) {
      await fetch(`/api/admin/encounter/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'roll' }),
      })
    }
    await fetchParticipants()
    setBusy(false)
  }

  async function setModifier(id: string, value: number) {
    setBusy(true)
    await fetch(`/api/admin/encounter/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initiative_modifier: value }),
    })
    await fetchParticipants()
    setBusy(false)
  }

  async function nextTurn() {
    if (!campaign) return
    setBusy(true)
    await fetch('/api/admin/encounter/next-turn', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaign.id }),
    })
    await fetchParticipants()
    setBusy(false)
  }

  async function resolveRequest(id: string, status: 'approved' | 'denied') {
    setBusy(true)
    await fetch(`/api/admin/action-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchRequests()
    setBusy(false)
  }

  if (!campaign) {
    return (
      <div className={styles.formPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Play</h1>
        </div>
        <p>No active campaign. Set one active on the Campaign page first.</p>
      </div>
    )
  }

  const current = participants.find(p => p.is_current_turn)
  const pendingRequests = requests.filter(r => r.status === 'pending')

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Play — {campaign.name}</h1>
      </div>

      {/* Pending action requests */}
      {pendingRequests.length > 0 && (
        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Pending Actions ({pendingRequests.length})</h2>
          {pendingRequests.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #333' }}>
              <div>
                <strong>{r.encounter_participants.characters.name}</strong> wants to use{' '}
                <strong>{r.actions.name}</strong>
                {r.target && <> on <strong>{r.target.characters.name}</strong></>}
                {r.actions.description && <p style={{ fontSize: '13px', color: '#aaa' }}>{r.actions.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={styles.saveBtn} onClick={() => resolveRequest(r.id, 'approved')} disabled={busy}>Approve</button>
                <button className={styles.deleteBtn} onClick={() => resolveRequest(r.id, 'denied')} disabled={busy}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current turn spotlight */}
      <div className={styles.formSection}>
        <h2 className={styles.formSectionTitle}>Current Turn</h2>
        {current ? (
          <div className={playStyles.spotlight}>
            {current.characters.avatar_url ? (
              <img src={current.characters.avatar_url} alt={current.characters.name} className={playStyles.spotlightImg} />
            ) : (
              <div className={playStyles.spotlightPlaceholder}>No image</div>
            )}
            <div>
              <h3 className={playStyles.spotlightName}>{current.characters.name}</h3>
              {current.characters.level !== undefined && (
                <p>
                  Level {current.characters.level} — Mental {current.characters.mental}/5,
                  {' '}Resonance {current.characters.resonance}/5, Alignment {current.characters.alignment}/5
                </p>
              )}
              <p>Initiative: {current.initiative_total ?? '—'}</p>
            </div>
          </div>
        ) : (
          <p>No one&apos;s turn yet — click Next Turn to begin.</p>
        )}
        <div className={styles.formActions} style={{ marginTop: '16px' }}>
          <button className={styles.saveBtn} onClick={nextTurn} disabled={busy || participants.length === 0}>
            Next Turn
          </button>
          <button className={styles.saveBtn} onClick={rollAll} disabled={busy || participants.length === 0}>
            Roll All Initiative
          </button>
        </div>
      </div>

      {/* Add to encounter */}
      <div className={styles.formSection}>
        <h2 className={styles.formSectionTitle}>Add to Encounter</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedToAdd}
            onChange={e => setSelectedToAdd(e.target.value)}
            style={{ background: 'transparent', color: '#e5d5b0', border: '1px solid #444', padding: '8px 12px', borderRadius: '4px', flex: 1 }}
          >
            <option value="">Select a character...</option>
            {available.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className={styles.saveBtn} onClick={addToEncounter} disabled={busy || !selectedToAdd}>
            Add
          </button>
        </div>
        {addError && <p style={{ color: '#e05c5c', fontSize: '13px', marginTop: '8px' }}>{addError}</p>}
      </div>

      {/* Roster */}
      <div className={styles.formSection}>
        <h2 className={styles.formSectionTitle}>Encounter Roster ({participants.length})</h2>
        <div className={playStyles.rosterList}>
          {participants.map(p => (
            <div key={p.id} className={`${playStyles.rosterRow} ${p.is_current_turn ? playStyles.rosterRowActive : ''}`}>
              {p.characters.avatar_url ? (
                <img src={p.characters.avatar_url} alt={p.characters.name} className={playStyles.rosterImg} />
              ) : (
                <div className={playStyles.rosterImgPlaceholder} />
              )}
              <div className={playStyles.rosterInfo}>
                <span className={playStyles.rosterName}>{p.characters.name}</span>
                <span className={playStyles.rosterMeta}>
                  Roll: {p.initiative_roll ?? '—'} + Mod:{' '}
                  <input
                    type="number"
                    defaultValue={p.initiative_modifier}
                    onBlur={e => setModifier(p.id, parseInt(e.target.value) || 0)}
                    style={{ width: '48px', background: 'transparent', border: '1px solid #444', color: 'inherit' }}
                  />
                  {' '}= {p.initiative_total ?? '—'}
                </span>
              </div>
              <button className={styles.saveBtn} onClick={() => rollInitiative(p.id)} disabled={busy}>
                Roll
              </button>
              <button className={styles.deleteBtn} onClick={() => removeParticipant(p.id)} disabled={busy}>
                Remove
              </button>
            </div>
          ))}
          {participants.length === 0 && <p>No one&apos;s in the encounter yet.</p>}
        </div>
      </div>
    </div>
  )
}
