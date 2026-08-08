'use client'
import { useState, useEffect, useCallback } from 'react'
import styles from './ConnectionsPanel.module.css'

interface Connection {
  id: string
  from_table: string
  from_id: string
  to_table: string
  to_id: string
  relationship: string
  notes: string | null
  other_name: string
  other_table: string
  other_id: string
  direction: 'from' | 'to'
}

interface Suggestion {
  suggested_to_id: string
  suggested_to_table: string
  suggested_to_name: string
  matched_keyword: string
  already_linked: boolean
}

interface SearchResult {
  id: string
  name: string
  table: string
}

const TABLE_COLORS: Record<string, string> = {
  characters: '#AFA9EC',
  timeline_events: '#5DCAA5',
  rules: '#EF9F27',
  factions: '#F0997B',
  nations: '#7de8d4',
}

const TABLE_LABELS: Record<string, string> = {
  characters: 'Character',
  timeline_events: 'Timeline',
  rules: 'Rule',
  factions: 'Faction',
  nations: 'Nation',
}

const RELATIONSHIP_OPTIONS = [
  'directly caused',
  'tied to',
  'reveals',
  'contradicts',
  'enables',
  'origin of',
  'imprisoned by',
  'central figure',
  'authored',
  'opposed by',
  'retroactively explains',
  'may be',
  'feeds',
  'related to',
]

interface Props {
  entryId: string
  entryTable: string
  entryText: string // combined text to scan for keywords
}

export default function ConnectionsPanel({ entryId, entryTable, entryText }: Props) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedTarget, setSelectedTarget] = useState<SearchResult | null>(null)
  const [relationship, setRelationship] = useState('related to')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const fetchConnections = useCallback(async () => {
    if (!entryId || entryId === '') return
    const res = await fetch(`/api/admin/connections/entry?id=${entryId}&table=${entryTable}`)
    if (res.ok) {
      const data = await res.json()
      setConnections(data.connections || [])
    }
  }, [entryId, entryTable])

  useEffect(() => { fetchConnections() }, [fetchConnections])

  const scanForSuggestions = async () => {
    if (!entryId || !entryText) return
    setScanning(true)
    const res = await fetch('/api/admin/connections/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId, entryTable, text: entryText }),
    })
    if (res.ok) {
      const data = await res.json()
      setSuggestions(data.suggestions || [])
    }
    setScanning(false)
  }

  const searchEntries = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    const res = await fetch(`/api/admin/connections/search?q=${encodeURIComponent(q)}&exclude_id=${entryId}`)
    if (res.ok) {
      const data = await res.json()
      setSearchResults(data.results || [])
    }
  }

  const addConnection = async (toId: string, toTable: string, rel: string, n: string) => {
    setSaving(true)
    const res = await fetch('/api/admin/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_table: entryTable,
        from_id: entryId,
        to_table: toTable,
        to_id: toId,
        relationship: rel,
        notes: n || null,
      }),
    })
    if (res.ok) {
      setStatus('success')
      setShowAddForm(false)
      setSelectedTarget(null)
      setSearchQuery('')
      setNotes('')
      setRelationship('related to')
      setSearchResults([])
      await fetchConnections()
      // Remove from suggestions if it was there
      setSuggestions(prev => prev.filter(s => s.suggested_to_id !== toId))
      setTimeout(() => setStatus('idle'), 2000)
    } else {
      setStatus('error')
    }
    setSaving(false)
  }

  const removeConnection = async (connectionId: string) => {
    if (!confirm('Remove this connection?')) return
    await fetch(`/api/admin/connections/${connectionId}`, { method: 'DELETE' })
    await fetchConnections()
  }

  const acceptSuggestion = (s: Suggestion) => {
    setSelectedTarget({ id: s.suggested_to_id, name: s.suggested_to_name, table: s.suggested_to_table })
    setRelationship('related to')
    setShowAddForm(true)
    setSuggestions(prev => prev.filter(x => x.suggested_to_id !== s.suggested_to_id))
  }

  const activeSuggestions = suggestions.filter(s => !s.already_linked && !dismissed.has(s.suggested_to_id))

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Connections</span>
        <div className={styles.panelActions}>
          <button
            className={styles.scanBtn}
            onClick={scanForSuggestions}
            disabled={scanning || !entryId}
          >
            {scanning ? 'Scanning...' : '⟳ Auto-detect'}
          </button>
          <button
            className={styles.addBtn}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Cancel' : '+ Add Link'}
          </button>
        </div>
      </div>

      {/* Auto-suggestions */}
      {activeSuggestions.length > 0 && (
        <div className={styles.suggestions}>
          <div className={styles.suggestionsHeader}>
            <span className={styles.suggestionsTitle}>
              ◈ {activeSuggestions.length} suggested connection{activeSuggestions.length !== 1 ? 's' : ''} detected
            </span>
          </div>
          {activeSuggestions.map(s => (
            <div key={s.suggested_to_id} className={styles.suggestion}>
              <div className={styles.suggestionInfo}>
                <span
                  className={styles.suggestionTag}
                  style={{ color: TABLE_COLORS[s.suggested_to_table] }}
                >
                  {TABLE_LABELS[s.suggested_to_table]}
                </span>
                <span className={styles.suggestionName}>{s.suggested_to_name}</span>
                <span className={styles.suggestionKeyword}>
                  matched &ldquo;{s.matched_keyword}&rdquo;
                </span>
              </div>
              <div className={styles.suggestionBtns}>
                <button className={styles.acceptBtn} onClick={() => acceptSuggestion(s)}>
                  Accept
                </button>
                <button
                  className={styles.dismissBtn}
                  onClick={() => setDismissed(prev => new Set([...prev, s.suggested_to_id]))}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add connection form */}
      {showAddForm && (
        <div className={styles.addForm}>
          {!selectedTarget ? (
            <div className={styles.searchBox}>
              <input
                className={styles.searchInput}
                placeholder="Search entries to link..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); searchEntries(e.target.value) }}
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  {searchResults.map(r => (
                    <div
                      key={r.id}
                      className={styles.searchResult}
                      onClick={() => { setSelectedTarget(r); setSearchQuery(''); setSearchResults([]) }}
                    >
                      <span
                        className={styles.resultTag}
                        style={{ color: TABLE_COLORS[r.table] }}
                      >
                        {TABLE_LABELS[r.table]}
                      </span>
                      <span className={styles.resultName}>{r.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.linkConfig}>
              <div className={styles.linkTarget}>
                <span className={styles.linkTargetLabel}>Linking to:</span>
                <span
                  className={styles.linkTargetTag}
                  style={{ color: TABLE_COLORS[selectedTarget.table] }}
                >
                  {TABLE_LABELS[selectedTarget.table]}
                </span>
                <span className={styles.linkTargetName}>{selectedTarget.name}</span>
                <button
                  className={styles.clearTarget}
                  onClick={() => setSelectedTarget(null)}
                >✕</button>
              </div>
              <select
                className={styles.relSelect}
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
              >
                {RELATIONSHIP_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <textarea
                className={styles.notesInput}
                placeholder="Notes (optional) — why are these connected?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
              <div className={styles.linkActions}>
                <button
                  className={styles.saveLinkBtn}
                  onClick={() => addConnection(selectedTarget.id, selectedTarget.table, relationship, notes)}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Connection'}
                </button>
                {status === 'success' && <span className={styles.successMsg}>Connected!</span>}
                {status === 'error' && <span className={styles.errorMsg}>Something went wrong.</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing connections */}
      {connections.length === 0 && !showAddForm && activeSuggestions.length === 0 && (
        <div className={styles.empty}>
          No connections yet. Click &ldquo;Auto-detect&rdquo; to scan for keyword matches,
          or &ldquo;Add Link&rdquo; to connect manually.
        </div>
      )}

      {connections.length > 0 && (
        <div className={styles.connectionList}>
          {connections.map(c => (
            <div key={c.id} className={styles.connection}>
              <span className={styles.connectionDir}>{c.direction === 'from' ? '→' : '←'}</span>
              <span
                className={styles.connectionTag}
                style={{ color: TABLE_COLORS[c.other_table] }}
              >
                {TABLE_LABELS[c.other_table]}
              </span>
              <span className={styles.connectionName}>{c.other_name}</span>
              <span className={styles.connectionRel}>({c.relationship})</span>
              {c.notes && <span className={styles.connectionNotes}>{c.notes}</span>}
              <button
                className={styles.removeBtn}
                onClick={() => removeConnection(c.id)}
                title="Remove connection"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
