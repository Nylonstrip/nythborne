'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextField, TextareaField, SelectField, CheckboxField } from '@/components/admin/FormFields'
import ConnectionsPanel from '@/components/admin/ConnectionsPanel'
import styles from '@/app/admin/shared.module.css'
import formStyles from './CharacterForm.module.css'
import Link from 'next/link'
import type { Character } from '@/lib/types'

const VISIBILITY_OPTIONS = [
  { value: 'hidden', label: 'Hidden (GM only)' },
  { value: 'revealed', label: 'Revealed (players can see)' },
  { value: 'public', label: 'Public (always visible)' },
]

export default function CharacterForm({ nyth: character }: { nyth?: Character }) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isNyth, setIsNyth] = useState(
    !!(character?.wish && character.wish !== 'Unknown') || false
  )
  const isNew = !character

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      is_player_character: formData.get('is_player_character') === 'on',
      wish: isNyth ? (formData.get('wish') || null) : null,
      manifestation_name: isNyth ? (formData.get('manifestation_name') || null) : null,
      manifestation_description: isNyth ? (formData.get('manifestation_description') || null) : null,
      crystalline_form: isNyth ? (formData.get('crystalline_form') || null) : null,
      personality_basis: isNyth ? (formData.get('personality_basis') || null) : null,
      overuse_effects: isNyth ? (formData.get('overuse_effects') || null) : null,
      current_condition: formData.get('current_condition') || null,
      near_death_event: isNyth ? (formData.get('near_death_event') || null) : null,
      background: formData.get('background') || null,
      visibility: formData.get('visibility'),
      gm_notes: formData.get('gm_notes') || null,
    }

    const res = await fetch(
      isNew ? '/api/admin/characters' : `/api/admin/characters/${character.id}`,
      { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )

    if (res.ok) { setStatus('success'); setTimeout(() => router.push('/admin/characters'), 800) }
    else { const d = await res.json(); setErrorMsg(d.error ?? 'Error'); setStatus('error') }
  }

  async function handleDelete() {
    if (!character || !confirm(`Delete "${character.name}"?`)) return
    await fetch(`/api/admin/characters/${character.id}`, { method: 'DELETE' })
    router.push('/admin/characters')
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{isNew ? 'New Character' : `Edit: ${character.name}`}</h1>
      </div>
      <form onSubmit={handleSubmit}>

        {/* Identity */}
        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Identity</h2>
          <div className={styles.formGrid}>
            <TextField label="Name" name="name" defaultValue={character?.name} required />
            <SelectField label="Visibility" name="visibility" defaultValue={character?.visibility ?? 'hidden'} options={VISIBILITY_OPTIONS} />
            <TextField label="Current Condition" name="current_condition" defaultValue={character?.current_condition ?? ''} hint="Physical or narrative state right now" />
            <div />
            <div className={styles.formGridFull}>
              <CheckboxField label="Player Character" name="is_player_character" defaultValue={character?.is_player_character} />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Background" name="background" defaultValue={character?.background ?? ''} />
            </div>
          </div>
        </div>

        {/* Nyth toggle */}
        <div className={styles.formSection}>
          <div className={formStyles.nythToggle}>
            <label className={formStyles.nythToggleLabel}>
              <input
                type="checkbox"
                checked={isNyth}
                onChange={e => setIsNyth(e.target.checked)}
                className={formStyles.nythToggleCheck}
              />
              <span className={formStyles.nythToggleText}>This character is a Nyth</span>
            </label>
            <p className={formStyles.nythToggleHint}>
              Enable to document their crystalline manifestation and Nythilian abilities.
            </p>
          </div>
        </div>

        {/* Nyth-specific fields — only shown if toggle is on */}
        {isNyth && (
          <>
            <div className={styles.formSection}>
              <h2 className={styles.formSectionTitle}>Nyth Manifestation</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGridFull}>
                  <TextField label="Wish at Near-Death" name="wish" defaultValue={character?.wish && character.wish !== 'Unknown' ? character.wish : ''} hint="The exact wish that triggered manifestation" />
                </div>
                <TextField label="Manifestation Name" name="manifestation_name" defaultValue={character?.manifestation_name && character.manifestation_name !== 'Unknown' ? character.manifestation_name : ''} />
                <div />
                <div className={styles.formGridFull}>
                  <TextareaField label="Manifestation Description" name="manifestation_description" defaultValue={character?.manifestation_description ?? ''} hint="What it looks like and what it does" />
                </div>
                <div className={styles.formGridFull}>
                  <TextareaField label="Crystalline Form" name="crystalline_form" defaultValue={character?.crystalline_form ?? ''} hint="Physical description of the crystal structure" />
                </div>
                <div className={styles.formGridFull}>
                  <TextareaField label="Personality Basis" name="personality_basis" defaultValue={character?.personality_basis ?? ''} hint="How their personality shaped this manifestation" />
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.formSectionTitle}>Limitations & History</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGridFull}>
                  <TextareaField label="Overuse Effects" name="overuse_effects" defaultValue={character?.overuse_effects ?? ''} hint="Specific anemia / weakness effects for this Nyth" />
                </div>
                <div className={styles.formGridFull}>
                  <TextareaField label="Near-Death Event" name="near_death_event" defaultValue={character?.near_death_event ?? ''} hint="What caused the manifestation to occur" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* GM Notes */}
        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>GM Notes (private)</h2>
          <TextareaField label="Notes" name="gm_notes" defaultValue={character?.gm_notes ?? ''} hint="Only visible to you." />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : 'Save Character'}
          </button>
          <Link href="/admin/characters" className={styles.cancelBtn}>Cancel</Link>
          {status === 'success' && <span className={styles.successMsg}>Saved!</span>}
          {status === 'error' && <span className={styles.errorMsg}>{errorMsg}</span>}
          {!isNew && <button type="button" className={styles.deleteBtn} onClick={handleDelete}>Delete</button>}
        </div>
      </form>

      {!isNew && character && (
        <ConnectionsPanel
          entryId={character.id}
          entryTable="characters"
          entryText={[character.name, character.wish, character.manifestation_name, character.manifestation_description, character.background, character.near_death_event, character.personality_basis].filter(Boolean).join(' ')}
        />
      )}
    </div>
  )
}
