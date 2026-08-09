'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlayerClient } from '@/lib/supabase'
import styles from './login.module.css'

export default function PlayerLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createPlayerClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid credentials. Check your email and password.')
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
          <p className={styles.subtitle}>Enter the world of Astraea</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
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
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Entering...' : 'Enter Astraea'}
          </button>
        </form>
      </div>
    </div>
  )
}
