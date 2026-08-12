'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from '@/app/admin/shared.module.css'

interface Action {
  id: string
  name: string
  description: string | null
  character_id: string | null
  characters: { name: string } | null
}

interface CharacterOption {
  id: string
  name: string
}

export default function AdminActionsPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [characters, setCharacters] = useState<CharacterOption[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [characterId, setCharacterId] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchActions = useCallback(async () => {
    const res = await fetch('/api/admin/actions')
    const d = await res.json()
    setActions(d.actions ?? [])
  }, [])

  useEffect(() => {
    fetchActions()
    fetch('/api/admin/characters/list')
      .then(r => r.json())
      .then(d => setCharacters(d.characters ?? []))
      .catch(() => setCharacters([]))
  }, [fetchActions])

  async function addAction() {
    if (!name) return
    setBusy(true)
    await fetch('/api/admin/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, character_id: characterId || null }),
    })
    setName('')
    setDescription('')
    setCharacterId('')
    await fetchActions()
    setBusy(false)
  }

  async function removeAction(id: string) {
    setBusy(true)
    await fetch(`/api/admin/actions/${id}`, { method: 'DELETE' })
    await fetchActions()
    setBusy(false)
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Actions</h1>
      </div>

      <div className={styles.formSection}>
        <h2 className={styles.formSectionTitle}>Add Action</h2>
        <div className={styles.formGrid}>
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <select value={characterId} onChange={e => setCharacterId(e.target.value)}>
            <option value="">Universal (everyone)</option>
            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className={styles.formGridFull}>
            <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ width: '100%' }} />
          </div>
        </div>
        <div className={styles.formActions} style={{ marginTop: '12px' }}>
          <button className={styles.saveBtn} onClick={addAction} disabled={busy || !name}>Add Action</button>
        </div>
      </div>

      <div className={styles.formSection}>
        <h2 className={styles.formSectionTitle}>All Actions</h2>
        {actions.map(a => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #333' }}>
            <div>
              <strong>{a.name}</strong>{' '}
              <span style={{ fontSize: '12px', color: '#999' }}>
                {a.characters ? `— ${a.characters.name} only` : '— Universal'}
              </span>
              {a.description && <p style={{ fontSize: '13px', color: '#aaa' }}>{a.description}</p>}
            </div>
            <button className={styles.deleteBtn} onClick={() => removeAction(a.id)} disabled={busy}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
