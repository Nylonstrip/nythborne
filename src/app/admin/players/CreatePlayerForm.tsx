'use client'

import { useState } from 'react'
import styles from '../shared.module.css'

interface Character { id: string; name: string }

export default function CreatePlayerForm({ characters }: { characters: Character[] }) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [characterId, setCharacterId] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const res = await fetch('/api/admin/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, email, password, characterId: characterId || null }),
    })

    const data = await res.json()

    if (!res.ok) {
      setStatus('error')
      setMessage(data.error ?? 'Failed to create player.')
      return
    }

    setStatus('success')
    setMessage(`Player "${displayName}" created. They can now log in at /player/login.`)
    setDisplayName('')
    setEmail('')
    setPassword('')
    setCharacterId('')
  }

  return (
    <form onSubmit={handleCreate} className={styles.formPage}>
      <div className={styles.formGrid}>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gm-gold-dim)', marginBottom: '8px' }}>
            Display Name
          </label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
            placeholder="e.g. Remy"
            style={{ width: '100%', background: 'rgba(200,168,75,0.02)', border: '1px solid var(--gm-border)', color: 'var(--gm-text)', fontFamily: 'var(--font-display)', fontSize: '14px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gm-gold-dim)', marginBottom: '8px' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="player@email.com"
            style={{ width: '100%', background: 'rgba(200,168,75,0.02)', border: '1px solid var(--gm-border)', color: 'var(--gm-text)', fontFamily: 'var(--font-display)', fontSize: '14px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gm-gold-dim)', marginBottom: '8px' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Set their initial password"
            style={{ width: '100%', background: 'rgba(200,168,75,0.02)', border: '1px solid var(--gm-border)', color: 'var(--gm-text)', fontFamily: 'var(--font-display)', fontSize: '14px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gm-gold-dim)', marginBottom: '8px' }}>
            Assign Character (optional)
          </label>
          <select
            value={characterId}
            onChange={e => setCharacterId(e.target.value)}
            style={{ width: '100%', background: 'var(--gm-panel)', border: '1px solid var(--gm-border)', color: characterId ? 'var(--gm-text)' : 'var(--gm-text-dim)', fontFamily: 'var(--font-display)', fontSize: '14px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }}
          >
            <option value="">— Assign later —</option>
            {characters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formActions} style={{ marginTop: '24px' }}>
        <button type="submit" className={styles.saveBtn} disabled={status === 'loading'}>
          {status === 'loading' ? 'Creating...' : 'Create Player'}
        </button>
        {status === 'success' && <span className={styles.successMsg}>{message}</span>}
        {status === 'error' && <span className={styles.errorMsg}>{message}</span>}
      </div>
    </form>
  )
}
