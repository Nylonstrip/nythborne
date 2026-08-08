'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextField, TextareaField, SelectField, NumberField } from '@/components/admin/FormFields'
import ConnectionsPanel from '@/components/admin/ConnectionsPanel'
import styles from '@/app/admin/shared.module.css'
import Link from 'next/link'
import type { Nation } from '@/lib/types'

const VISIBILITY_OPTIONS = [
  { value: 'hidden', label: 'Hidden (GM only)' },
  { value: 'revealed', label: 'Revealed (players can see)' },
  { value: 'public', label: 'Public (always visible)' },
]

const TYPE_OPTIONS = [
  { value: 'superpower', label: 'Superpower' },
  { value: 'city_state', label: 'City-State' },
  { value: 'settlement', label: 'Settlement' },
  { value: 'pocket_nation', label: 'Pocket Nation' },
]

interface NationFormProps {
  nation?: Nation
}

export default function NationForm({ nation }: NationFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const isNew = !nation

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')

    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      type: formData.get('type'),
      description: formData.get('description') || null,
      geography: formData.get('geography') || null,
      culture: formData.get('culture') || null,
      government: formData.get('government') || null,
      religion: formData.get('religion') || null,
      known_nyths: parseInt(formData.get('known_nyths') as string) || 0,
      relic_count: parseInt(formData.get('relic_count') as string) || 0,
      visibility: formData.get('visibility'),
      gm_notes: formData.get('gm_notes') || null,
    }

    const res = await fetch(
      isNew ? '/api/admin/nations' : `/api/admin/nations/${nation.id}`,
      {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (res.ok) {
      setStatus('success')
      setTimeout(() => router.push('/admin/nations'), 800)
    } else {
      const data = await res.json()
      setErrorMsg(data.error ?? 'Something went wrong.')
      setStatus('error')
    }
  }

  async function handleDelete() {
    if (!nation || !confirm(`Delete "${nation.name}"? This cannot be undone.`)) return
    await fetch(`/api/admin/nations/${nation.id}`, { method: 'DELETE' })
    router.push('/admin/nations')
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{isNew ? 'New Nation' : `Edit: ${nation.name}`}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Basic Info</h2>
          <div className={styles.formGrid}>
            <TextField label="Name" name="name" defaultValue={nation?.name} required />
            <SelectField label="Type" name="type" defaultValue={nation?.type ?? 'superpower'} options={TYPE_OPTIONS} required />
            <SelectField label="Visibility" name="visibility" defaultValue={nation?.visibility ?? 'hidden'} options={VISIBILITY_OPTIONS} />
            <div />
            <NumberField label="Known Nyths" name="known_nyths" defaultValue={String(nation?.known_nyths ?? 0)} />
            <NumberField label="Known Relics Held" name="relic_count" defaultValue={String(nation?.relic_count ?? 0)} />
            <div className={styles.formGridFull}>
              <TextareaField label="Description" name="description" defaultValue={nation?.description ?? ''} />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>World Details</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGridFull}>
              <TextareaField label="Geography" name="geography" defaultValue={nation?.geography ?? ''} hint="Terrain, climate, layout" />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Culture" name="culture" defaultValue={nation?.culture ?? ''} hint="Customs, values, social structure" />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Government" name="government" defaultValue={nation?.government ?? ''} />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Religion" name="religion" defaultValue={nation?.religion ?? ''} hint="What they believe about world history" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>GM Notes (private)</h2>
          <TextareaField label="Notes" name="gm_notes" defaultValue={nation?.gm_notes ?? ''} hint="Only visible to you. Never shown to players." />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : 'Save Nation'}
          </button>
          <Link href="/admin/nations" className={styles.cancelBtn}>Cancel</Link>
          {status === 'success' && <span className={styles.successMsg}>Saved!</span>}
          {status === 'error' && <span className={styles.errorMsg}>{errorMsg}</span>}
          {!isNew && (
            <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </form>

      {!isNew && nation && (
        <ConnectionsPanel
          entryId={nation.id}
          entryTable="nations"
          entryText={[nation.name, nation.description, nation.culture, nation.geography, nation.religion, nation.government].filter(Boolean).join(' ')}
        />
      )}
    </div>
  )
}
