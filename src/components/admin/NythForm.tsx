'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextField, TextareaField, SelectField, CheckboxField } from '@/components/admin/FormFields'
import ConnectionsPanel from '@/components/admin/ConnectionsPanel'
import styles from '@/app/admin/shared.module.css'
import Link from 'next/link'
import type { Nyth } from '@/lib/types'

const VISIBILITY_OPTIONS = [
  { value: 'hidden', label: 'Hidden (GM only)' },
  { value: 'revealed', label: 'Revealed (players can see)' },
  { value: 'public', label: 'Public (always visible)' },
]

export default function NythForm({ nyth }: { nyth?: Nyth }) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const isNew = !nyth

  const [newTrait, setNewTrait] = useState('')
  const [levelingUp, setLevelingUp] = useState(false)
  const [levelUpMsg, setLevelUpMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      is_player_character: formData.get('is_player_character') === 'on',
      wish: formData.get('wish'),
      manifestation_name: formData.get('manifestation_name'),
      manifestation_description: formData.get('manifestation_description') || null,
      crystalline_form: formData.get('crystalline_form') || null,
      personality_basis: formData.get('personality_basis') || null,
      overuse_effects: formData.get('overuse_effects') || null,
      current_condition: formData.get('current_condition') || null,
      near_death_event: formData.get('near_death_event') || null,
      background: formData.get('background') || null,
      visibility: formData.get('visibility'),
      gm_notes: formData.get('gm_notes') || null,
    }

    const res = await fetch(
      isNew ? '/api/admin/nyths' : `/api/admin/nyths/${nyth.id}`,
      { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )

    if (res.ok) { setStatus('success'); setTimeout(() => router.push('/admin/nyths'), 800) }
    else { const d = await res.json(); setErrorMsg(d.error ?? 'Error'); setStatus('error') }
  }

  async function handleDelete() {
    if (!nyth || !confirm(`Delete "${nyth.name}"?`)) return
    await fetch(`/api/admin/nyths/${nyth.id}`, { method: 'DELETE' })
    router.push('/admin/nyths')
  }

  async function handleGrantLevelUp() {
    if (!nyth) return
    setLevelingUp(true)
    setLevelUpMsg('')
    const res = await fetch(`/api/admin/characters/${nyth.id}/levelup`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newTrait: newTrait || null }),
    })
    if (res.ok) {
      setLevelUpMsg('Level up granted!')
      setNewTrait('')
      router.refresh()
    } else {
      const d = await res.json()
      setLevelUpMsg(d.error ?? 'Something went wrong.')
    }
    setLevelingUp(false)
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{isNew ? 'New Nyth' : `Edit: ${nyth.name}`}</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Identity</h2>
          <div className={styles.formGrid}>
            <TextField label="Name" name="name" defaultValue={nyth?.name} required />
            <SelectField label="Visibility" name="visibility" defaultValue={nyth?.visibility ?? 'hidden'} options={VISIBILITY_OPTIONS} />
            <div className={styles.formGridFull}>
              <CheckboxField label="Player Character" name="is_player_character" defaultValue={nyth?.is_player_character} />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Background" name="background" defaultValue={nyth?.background ?? ''} />
            </div>
          </div>
        </div>

        {!isNew && nyth && (
          <div className={styles.formSection}>
            <h2 className={styles.formSectionTitle}>Progression</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGridFull}>
                <p>
                  Level {nyth.level ?? 1} — Mental {nyth.mental ?? 0}/5,
                  {' '}Resonance {nyth.resonance ?? 0}/5, Alignment {nyth.alignment ?? 0}/5
                </p>
                {(nyth.unspent_points ?? 0) > 0 && (
                  <p>{nyth.unspent_points} unspent point(s) waiting for the player to allocate.</p>
                )}
                {nyth.traits && nyth.traits.length > 0 && (
                  <ul>
                    {nyth.traits.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                )}
              </div>
              <div className={styles.formGridFull}>
                <label htmlFor="new_trait">New Trait (optional)</label>
                <input
                  id="new_trait"
                  type="text"
                  value={newTrait}
                  onChange={e => setNewTrait(e.target.value)}
                  placeholder="e.g. Read the Room"
                />
              </div>
            </div>
            <div className={styles.formActions} style={{ marginTop: '12px' }}>
              <button type="button" className={styles.saveBtn} onClick={handleGrantLevelUp} disabled={levelingUp}>
                {levelingUp ? 'Granting...' : 'Grant Level Up'}
              </button>
              {levelUpMsg && <span className={styles.successMsg}>{levelUpMsg}</span>}
            </div>
          </div>
        )}

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Manifestation</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGridFull}>
              <TextField label="Wish at Near-Death" name="wish" defaultValue={nyth?.wish} required hint="The exact wish that triggered manifestation" />
            </div>
            <TextField label="Manifestation Name" name="manifestation_name" defaultValue={nyth?.manifestation_name} required />
            <TextField label="Current Condition" name="current_condition" defaultValue={nyth?.current_condition ?? ''} />
            <div className={styles.formGridFull}>
              <TextareaField label="Manifestation Description" name="manifestation_description" defaultValue={nyth?.manifestation_description ?? ''} hint="What it looks like and what it does" />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Crystalline Form" name="crystalline_form" defaultValue={nyth?.crystalline_form ?? ''} hint="Physical description of the crystal structure" />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Personality Basis" name="personality_basis" defaultValue={nyth?.personality_basis ?? ''} hint="How their personality shaped this manifestation" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Limitations & History</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGridFull}>
              <TextareaField label="Overuse Effects" name="overuse_effects" defaultValue={nyth?.overuse_effects ?? ''} hint="Specific anemia / weakness effects for this Nyth" />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Near-Death Event" name="near_death_event" defaultValue={nyth?.near_death_event ?? ''} hint="What caused the manifestation to occur" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>GM Notes (private)</h2>
          <TextareaField label="Notes" name="gm_notes" defaultValue={nyth?.gm_notes ?? ''} hint="Only visible to you." />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : 'Save Nyth'}
          </button>
          <Link href="/admin/nyths" className={styles.cancelBtn}>Cancel</Link>
          {status === 'success' && <span className={styles.successMsg}>Saved!</span>}
          {status === 'error' && <span className={styles.errorMsg}>{errorMsg}</span>}
          {!isNew && <button type="button" className={styles.deleteBtn} onClick={handleDelete}>Delete</button>}
        </div>
      </form>

      {!isNew && nyth && (
        <ConnectionsPanel
          entryId={nyth.id}
          entryTable="nyths"
          entryText={[nyth.name, nyth.wish, nyth.manifestation_name, nyth.manifestation_description, nyth.background, nyth.near_death_event, nyth.personality_basis].filter(Boolean).join(' ')}
        />
      )}
    </div>
  )
}
