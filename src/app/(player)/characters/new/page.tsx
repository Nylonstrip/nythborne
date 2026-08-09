'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlayerClient } from '@/lib/supabase'
import styles from './character_new.module.css'

export default function NewCharacterPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    const supabase = createPlayerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('Not logged in.')
      setStatus('error')
      return
    }

    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      is_player_character: true,
      approval_status: 'pending',
      wish: formData.get('wish'),
      manifestation_name: formData.get('manifestation_name'),
      manifestation_description: formData.get('manifestation_description') || null,
      background: formData.get('background') || null,
      visibility: 'hidden',
    }

    const { data: newChar, error: insertError } = await supabase
      .from('characters')
      .insert(payload)
      .select()
      .single()

    if (insertError) {
      setErrorMsg(insertError.message)
      setStatus('error')
      return
    }

    const { error: linkError } = await supabase
      .from('player_profiles')
      .update({ character_id: newChar.id })
      .eq('user_id', user.id)

    if (linkError) {
      setErrorMsg(linkError.message)
      setStatus('error')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className={styles.shell}>
      <div className={styles.bgStars} aria-hidden="true" />
      <div className={styles.bgVignette} aria-hidden="true" />

      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Astraea</span>
          <h1 className={styles.title}>Submit Your Character</h1>
          <p className={styles.subtitle}>Your submission will be reviewed by the GM before it appears in the world.</p>
        </header>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input type="text" name="name" className={styles.input} required />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Wish</label>
              <p className={styles.hint}>What drives them — the core want behind everything they do.</p>
              <input type="text" name="wish" className={styles.input} required />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Manifestation Name</label>
              <input type="text" name="manifestation_name" className={styles.input} required />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Manifestation Description</label>
              <p className={styles.hint}>What it looks like and what it does.</p>
              <textarea name="manifestation_description" rows={3} className={styles.textarea} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Background</label>
              <textarea name="background" rows={5} className={styles.textarea} />
            </div>

            {status === 'error' && <p className={styles.error}>{errorMsg}</p>}

            <button type="submit" className={styles.btn} disabled={status === 'saving'}>
              {status === 'saving' ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
