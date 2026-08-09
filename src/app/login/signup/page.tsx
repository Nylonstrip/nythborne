'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlayerClient } from '@/lib/supabase'
import styles from '../login/login.module.css'

export default function PlayerSignup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createPlayerClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      // Email confirmation is still ON in Supabase settings — tell them to check their inbox
      setError('Account created. Check your email to confirm before logging in.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className={styles.shell}>
      <div className={styles.bgStars} aria-hidden="true" />
      <div className={styles.bgVignette} aria-hidden="true" />

      <div className={styles.card}>
        <div className={styles.cardGlow} aria-hidden="true" />

        <div className={styles.header}>
          <div className={styles.emblem} aria-hidden="true">
            <div className={styles.emblemInner} />
          </div>
          <h1 className={styles.title}>NYTHBORNE</h1>
          <p className={styles.subtitle}>Begin your story in Astraea</p>
        </div>

        <form onSubmit={handleSignup} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Creating...' : 'Begin Your Story'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          <a href="/login">Already have an account? Log in</a>
        </p>
      </div>
    </div>
  )
}
