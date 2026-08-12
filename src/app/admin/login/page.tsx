'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlayerClient } from '@/lib/supabase'
import styles from './login.module.css'

export default function AdminLoginPage() {
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

    // Middleware checks gm_users on the next request — if this account
    // isn't a GM, it'll bounce back here even though login itself succeeded.
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Nythborne</p>
        <h1 className={styles.title}>GM Access</h1>
        <p className={styles.desc}>This area is for the Game Master only.</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.input}
            autoFocus
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            autoComplete="current-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Entering...' : 'Enter the GM Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
