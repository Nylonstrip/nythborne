'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextField, TextareaField, SelectField, CheckboxField, NumberField } from '@/components/admin/FormFields'
import ConnectionsPanel from '@/components/admin/ConnectionsPanel'
import styles from '@/app/admin/shared.module.css'
import Link from 'next/link'
import type { Relic } from '@/lib/types'

const VISIBILITY_OPTIONS = [
  { value: 'hidden', label: 'Hidden (GM only)' },
  { value: 'revealed', label: 'Revealed (players can see)' },
  { value: 'public', label: 'Public (always visible)' },
]

const POWER_SOURCE_OPTIONS = [
  { value: 'nythilian', label: 'Nythilian' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'elemental', label: 'Elemental' },
  { value: 'unknown', label: 'Unknown' },
]

export default function RelicForm({ relic }: { relic?: Relic }) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const isNew = !relic

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    const formData = new FormData(e.currentTarget)
    const relicNum = formData.get('relic_number')
    const payload = {
      name: formData.get('name'),
      relic_number: relicNum ? parseInt(relicNum as string) : null,
      description: formData.get('description') || null,
      ability: formData.get('ability'),
      power_source: formData.get('power_source'),
      power_cost: formData.get('power_cost') || null,
      self_harm_threshold: formData.get('self_harm_threshold') || null,
      current_owner: formData.get('current_owner') || null,
      is_discovered: formData.get('is_discovered') === 'on',
      origin: formData.get('origin') || null,
      known_history: formData.get('known_history') || null,
      visibility: formData.get('visibility'),
      gm_notes: formData.get('gm_notes') || null,
    }

    const res = await fetch(
      isNew ? '/api/admin/relics' : `/api/admin/relics/${relic.id}`,
      { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )

    if (res.ok) { setStatus('success'); setTimeout(() => router.push('/admin/relics'), 800) }
    else { const d = await res.json(); setErrorMsg(d.error ?? 'Error'); setStatus('error') }
  }

  async function handleDelete() {
    if (!relic || !confirm(`Delete "${relic.name}"?`)) return
    await fetch(`/api/admin/relics/${relic.id}`, { method: 'DELETE' })
    router.push('/admin/relics')
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{isNew ? 'New Relic' : `Edit: ${relic.name}`}</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Registry Info</h2>
          <div className={styles.formGrid}>
            <TextField label="Name" name="name" defaultValue={relic?.name} required />
            <NumberField label="Relic Number (1–300)" name="relic_number" defaultValue={String(relic?.relic_number ?? '')} hint="Unique registry number" />
            <SelectField label="Visibility" name="visibility" defaultValue={relic?.visibility ?? 'hidden'} options={VISIBILITY_OPTIONS} />
            <SelectField label="Power Source" name="power_source" defaultValue={relic?.power_source ?? 'nythilian'} options={POWER_SOURCE_OPTIONS} />
            <div className={styles.formGridFull}>
              <TextareaField label="Description" name="description" defaultValue={relic?.description ?? ''} />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Ability" name="ability" defaultValue={relic?.ability ?? ''} required hint="What this relic actually does" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Usage & Limits</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGridFull}>
              <TextareaField label="Power Cost" name="power_cost" defaultValue={relic?.power_cost ?? ''} hint="How much nythilian (or other resource) per use" />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Self-Harm Threshold" name="self_harm_threshold" defaultValue={relic?.self_harm_threshold ?? ''} hint="At what point does the user start harming themselves to fuel it" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Status & Location</h2>
          <div className={styles.formGrid}>
            <TextField label="Current Owner" name="current_owner" defaultValue={relic?.current_owner ?? ''} hint="Name, faction, or 'Unknown'" />
            <div />
            <div className={styles.formGridFull}>
              <CheckboxField label="Discovered by Players" name="is_discovered" defaultValue={relic?.is_discovered} />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Lore</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGridFull}>
              <TextareaField label="Origin" name="origin" defaultValue={relic?.origin ?? ''} hint="Where and how it was created" />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Known History" name="known_history" defaultValue={relic?.known_history ?? ''} hint="Who has held it, what has been done with it" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>GM Notes (private)</h2>
          <TextareaField label="Notes" name="gm_notes" defaultValue={relic?.gm_notes ?? ''} hint="Only visible to you." />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : 'Save Relic'}
          </button>
          <Link href="/admin/relics" className={styles.cancelBtn}>Cancel</Link>
          {status === 'success' && <span className={styles.successMsg}>Saved!</span>}
          {status === 'error' && <span className={styles.errorMsg}>{errorMsg}</span>}
          {!isNew && <button type="button" className={styles.deleteBtn} onClick={handleDelete}>Delete</button>}
        </div>
      </form>
    </div>
  )
}
