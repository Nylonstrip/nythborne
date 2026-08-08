'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextField, TextareaField, SelectField, NumberField } from '@/components/admin/FormFields'
import ConnectionsPanel from '@/components/admin/ConnectionsPanel'
import styles from '@/app/admin/shared.module.css'
import Link from 'next/link'
import type { TimelineEvent } from '@/lib/types'

const VISIBILITY_OPTIONS = [
  { value: 'hidden', label: 'Hidden (GM only)' },
  { value: 'revealed', label: 'Revealed (players can see)' },
  { value: 'public', label: 'Public (always visible)' },
]

export default function TimelineForm({ event }: { event?: TimelineEvent }) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const isNew = !event

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    const formData = new FormData(e.currentTarget)
    const payload = {
      title: formData.get('title'),
      era: formData.get('era') || null,
      order_index: parseInt(formData.get('order_index') as string) || 0,
      description: formData.get('description') || null,
      significance: formData.get('significance') || null,
      religious_interpretation: formData.get('religious_interpretation') || null,
      visibility: formData.get('visibility'),
      gm_notes: formData.get('gm_notes') || null,
    }

    const res = await fetch(
      isNew ? '/api/admin/timeline' : `/api/admin/timeline/${event.id}`,
      { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )

    if (res.ok) { setStatus('success'); setTimeout(() => router.push('/admin/timeline'), 800) }
    else { const d = await res.json(); setErrorMsg(d.error ?? 'Error'); setStatus('error') }
  }

  async function handleDelete() {
    if (!event || !confirm(`Delete "${event.title}"?`)) return
    await fetch(`/api/admin/timeline/${event.id}`, { method: 'DELETE' })
    router.push('/admin/timeline')
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{isNew ? 'New Timeline Event' : `Edit: ${event.title}`}</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Event Info</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGridFull}>
              <TextField label="Title" name="title" defaultValue={event?.title} required />
            </div>
            <TextField label="Era / Age" name="era" defaultValue={event?.era ?? ''} hint='e.g. "The First Age"' />
            <NumberField label="Order Index" name="order_index" defaultValue={String(event?.order_index ?? 0)} hint="Controls chronological display order" />
            <SelectField label="Visibility" name="visibility" defaultValue={event?.visibility ?? 'hidden'} options={VISIBILITY_OPTIONS} />
            <div />
            <div className={styles.formGridFull}>
              <TextareaField label="Description" name="description" defaultValue={event?.description ?? ''} hint="What happened" />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Significance" name="significance" defaultValue={event?.significance ?? ''} hint="Why this matters to the world" />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Religious Interpretation" name="religious_interpretation" defaultValue={event?.religious_interpretation ?? ''} hint="How religions or cultures interpreted or misunderstood this event" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>GM Notes (private)</h2>
          <TextareaField label="Notes" name="gm_notes" defaultValue={event?.gm_notes ?? ''} />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : 'Save Event'}
          </button>
          <Link href="/admin/timeline" className={styles.cancelBtn}>Cancel</Link>
          {status === 'success' && <span className={styles.successMsg}>Saved!</span>}
          {status === 'error' && <span className={styles.errorMsg}>{errorMsg}</span>}
          {!isNew && <button type="button" className={styles.deleteBtn} onClick={handleDelete}>Delete</button>}
        </div>
      </form>

      {!isNew && event && (
        <ConnectionsPanel
          entryId={event.id}
          entryTable="timeline_events"
          entryText={[event.title, event.description, event.significance, event.religious_interpretation].filter(Boolean).join(' ')}
        />
      )}
    </div>
  )
}
