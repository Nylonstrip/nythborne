'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Nythborne</p>
        <h1 className={styles.title}>GM Access</h1>
        <p className={styles.desc}>This area is for the Game Master only.</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <input
            type="password"
            placeholder="Enter GM password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            autoFocus
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
