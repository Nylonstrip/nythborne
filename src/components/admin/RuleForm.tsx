'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextField, TextareaField, SelectField, NumberField } from '@/components/admin/FormFields'
import styles from '@/app/admin/shared.module.css'
import Link from 'next/link'
import type { Rule } from '@/lib/types'

const VISIBILITY_OPTIONS = [
  { value: 'hidden', label: 'Hidden (GM only)' },
  { value: 'revealed', label: 'Revealed' },
  { value: 'public', label: 'Public (always visible)' },
]

const CATEGORY_OPTIONS = [
  { value: 'nyth_mechanics', label: 'Nyth Mechanics' },
  { value: 'relic_mechanics', label: 'Relic Mechanics' },
  { value: 'skills', label: 'Skills' },
  { value: 'combat', label: 'Combat' },
  { value: 'general', label: 'General Rules' },
]

export default function RuleForm({ rule }: { rule?: Rule }) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const isNew = !rule

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    const formData = new FormData(e.currentTarget)
    const payload = {
      title: formData.get('title'),
      category: formData.get('category'),
      content: formData.get('content'),
      examples: formData.get('examples') || null,
      order_index: parseInt(formData.get('order_index') as string) || 0,
      visibility: formData.get('visibility'),
      gm_notes: formData.get('gm_notes') || null,
    }

    const res = await fetch(
      isNew ? '/api/admin/rules' : `/api/admin/rules/${rule.id}`,
      { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )

    if (res.ok) { setStatus('success'); setTimeout(() => router.push('/admin/rules'), 800) }
    else { const d = await res.json(); setErrorMsg(d.error ?? 'Error'); setStatus('error') }
  }

  async function handleDelete() {
    if (!rule || !confirm(`Delete "${rule.title}"?`)) return
    await fetch(`/api/admin/rules/${rule.id}`, { method: 'DELETE' })
    router.push('/admin/rules')
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{isNew ? 'New Rule' : `Edit: ${rule.title}`}</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Rule Info</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGridFull}>
              <TextField label="Title" name="title" defaultValue={rule?.title} required />
            </div>
            <SelectField label="Category" name="category" defaultValue={rule?.category ?? 'general'} options={CATEGORY_OPTIONS} required />
            <SelectField label="Visibility" name="visibility" defaultValue={rule?.visibility ?? 'public'} options={VISIBILITY_OPTIONS} />
            <NumberField label="Order (within category)" name="order_index" defaultValue={String(rule?.order_index ?? 0)} />
            <div />
            <div className={styles.formGridFull}>
              <TextareaField label="Rule Content" name="content" defaultValue={rule?.content ?? ''} required hint="Write in plain language players can understand" />
            </div>
            <div className={styles.formGridFull}>
              <TextareaField label="Examples" name="examples" defaultValue={rule?.examples ?? ''} hint="Optional worked example to illustrate the rule" />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>GM Notes (private)</h2>
          <TextareaField label="Notes" name="gm_notes" defaultValue={rule?.gm_notes ?? ''} />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : 'Save Rule'}
          </button>
          <Link href="/admin/rules" className={styles.cancelBtn}>Cancel</Link>
          {status === 'success' && <span className={styles.successMsg}>Saved!</span>}
          {status === 'error' && <span className={styles.errorMsg}>{errorMsg}</span>}
          {!isNew && <button type="button" className={styles.deleteBtn} onClick={handleDelete}>Delete</button>}
        </div>
      </form>
    </div>
  )
}
