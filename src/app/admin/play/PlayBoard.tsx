'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
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
  health?: number
  max_health?: number
  mana?: number
  max_mana?: number
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

interface ActionOption {
  id: string
  name: string
  description: string | null
}

interface ActionRequest {
  id: string
  status: string
  outcome_description: string | null
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
  const [allActions, setAllActions] = useState<ActionOption[]>([])
  const [npcAction, setNpcAction] = useState('')
  const [npcTarget, setNpcTarget] = useState('')

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

  const fetchActions = useCallback(async () => {
    const res = await fetch('/api/admin/actions')
    const d = await res.json()
    setAllActions(d.actions ?? [])
  }, [])

  useEffect(() => {
    fetchParticipants()
    fetchAvailable()
    fetchRequests()
    fetchActions()
    const interval = setInterval(fetchRequests, 5000)
    return () => clearInterval(interval)
  }, [fetchParticipants, fetchAvailable, fetchRequests, fetchActions])

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

  async function setHealthMana(id: string, field: 'health' | 'mana', value: number) {
    // NOTE: health/mana live on the character row, not the participant row —
    // update via the character's own PATCH endpoint.
    const participant = participants.find(p => p.id === id)
    if (!participant) return
    setBusy(true)
    await fetch(`/api/admin/characters/${participant.character_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
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

  async function saveOutcome(id: string, text: string) {
    await fetch(`/api/admin/action-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome_description: text }),
    })
    await fetchRequests()
  }

  async function declareNpcAction() {
    if (!campaign || !current || !npcAction || !npcTarget) return
    setBusy(true)
    await fetch('/api/admin/action-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: campaign.id,
        participant_id: current.id,
        action_id: npcAction,
        target_participant_id: npcTarget,
      }),
    })
    setNpcAction('')
    setNpcTarget('')
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
  const currentIsNpc = current && current.characters.is_player_character === false

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Play — {campaign.name}</h1>
      </div>

      {/* Action log — all requests, outcome editable on every one */}
      {requests.length > 0 && (
        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Action Log</h2>
          {requests.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: '1px solid #333', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '180px' }}>
                <strong>{r.encounter_participants.characters.name}</strong> — {r.actions.name}
                {r.target && <> → <strong>{r.target.characters.name}</strong></>}
              </div>
              <input
                type="text"
                defaultValue={r.outcome_description ?? ''}
                placeholder="Outcome (e.g. 5 damage)"
                onBlur={e => saveOutcome(r.id, e.target.value)}
                style={{ flex: 1, minWidth: '160px', background: 'transparent', border: '1px solid #444', color: 'inherit', padding: '6px 10px', borderRadius: '4px' }}
              />
              {r.status === 'pending' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={styles.saveBtn} onClick={() => resolveRequest(r.id, 'approved')} disabled={busy}>Approve</button>
                  <button className={styles.deleteBtn} onClick={() => resolveRequest(r.id, 'denied')} disabled={busy}>Deny</button>
                </div>
              ) : (
                <span style={{
                  fontSize: '11px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '3px',
                  border: `1px solid ${r.status === 'approved' ? '#7de8d4' : '#e05c5c'}`,
                  color: r.status === 'approved' ? '#7de8d4' : '#e05c5c',
                }}>
                  {r.status}
                </span>
              )}
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
              <h3 className={playStyles.spotlightName}>
                <Link href={`/admin/characters/${current.character_id}`} style={{ color: 'inherit' }}>
                  {current.characters.name}
                </Link>
                {currentIsNpc && <span style={{ fontSize: '11px', marginLeft: '10px', opacity: 0.7 }}>(NPC)</span>}
              </h3>
              {current.characters.level !== undefined && (
                <p>
                  Level {current.characters.level} — Mental {current.characters.mental}/5,
                  {' '}Resonance {current.characters.resonance}/5, Alignment {current.characters.alignment}/5
                </p>
              )}
              <p>HP {current.characters.health}/{current.characters.max_health} — MP {current.characters.mana}/{current.characters.max_mana}</p>
              <p>Initiative: {current.initiative_total ?? '—'}</p>
            </div>
          </div>
        ) : (
          <p>No one&apos;s turn yet — click Next Turn to begin.</p>
        )}

        {currentIsNpc && current && (
          <div style={{ marginTop: '16px', padding: '14px', border: '1px dashed #444', borderRadius: '6px' }}>
            <p style={{ fontSize: '13px', marginBottom: '8px' }}>Declare this NPC&apos;s action (auto-approved):</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select value={npcAction} onChange={e => setNpcAction(e.target.value)} style={{ background: 'transparent', color: '#e5d5b0', border: '1px solid #444', padding: '8px 12px', borderRadius: '4px' }}>
                <option value="">Action...</option>
                {allActions.filter(a => !a.description || true).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select value={npcTarget} onChange={e => setNpcTarget(e.target.value)} style={{ background: 'transparent', color: '#e5d5b0', border: '1px solid #444', padding: '8px 12px', borderRadius: '4px' }}>
                <option value="">Target...</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.characters.name}</option>)}
              </select>
              <button className={styles.saveBtn} onClick={declareNpcAction} disabled={busy || !npcAction || !npcTarget}>Declare</button>
            </div>
          </div>
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
                <span className={playStyles.rosterName}>
                  <Link href={`/admin/characters/${p.character_id}`} style={{ color: 'inherit' }}>{p.characters.name}</Link>
                </span>
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
                <span className={playStyles.rosterMeta}>
                  HP:{' '}
                  <input
                    type="number"
                    defaultValue={p.characters.health}
                    onBlur={e => setHealthMana(p.id, 'health', parseInt(e.target.value) || 0)}
                    style={{ width: '48px', background: 'transparent', border: '1px solid #444', color: 'inherit' }}
                  />
                  /{p.characters.max_health} — MP:{' '}
                  <input
                    type="number"
                    defaultValue={p.characters.mana}
                    onBlur={e => setHealthMana(p.id, 'mana', parseInt(e.target.value) || 0)}
                    style={{ width: '48px', background: 'transparent', border: '1px solid #444', color: 'inherit' }}
                  />
                  /{p.characters.max_mana}
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
