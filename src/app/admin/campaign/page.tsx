'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from '@/app/admin/shared.module.css'
import campaignStyles from './campaign.module.css'
import { TextareaField, TextField, CheckboxField } from '@/components/admin/FormFields'

interface Campaign { id: string; name: string; description: string; is_active: boolean; current_session: number }
interface Session { id: string; session_number: number; title: string; summary: string; live_notes: string }

function AdminCampaignPageInner() {
  const searchParams = useSearchParams()
  const campaignIdParam = searchParams.get('id')
  const isNew = searchParams.get('new') === 'true'

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [liveNotes, setLiveNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])

  // Session editing state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [savingSession, setSavingSession] = useState(false)

  useEffect(() => {
    fetch('/api/admin/campaigns').then(r => r.json()).then(d => setAllCampaigns(d.campaigns ?? []))
  }, [])

  useEffect(() => {
    if (isNew) {
      setCampaign(null)
      setSessions([])
      setLiveNotes('')
      return
    }
    const url = campaignIdParam ? `/api/admin/campaign?id=${campaignIdParam}` : '/api/admin/campaign'
    fetch(url).then(r => r.json()).then(d => {
      if (d.campaign) { setCampaign(d.campaign); setSessions(d.sessions ?? []) }
      if (d.currentSession?.live_notes) setLiveNotes(d.currentSession.live_notes)
    })
  }, [campaignIdParam, isNew])

  async function handleCampaignSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      description: formData.get('description') || null,
      is_active: formData.get('is_active') === 'on',
    }
    const res = await fetch(campaign ? `/api/admin/campaign/${campaign.id}` : '/api/admin/campaign', {
      method: campaign ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const d = await res.json()
      setCampaign(d)
      setStatus('success')
      fetch('/api/admin/campaigns').then(r => r.json()).then(dd => setAllCampaigns(dd.campaigns ?? []))
    }
    else setStatus('error')
  }

  async function saveNewSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!campaign) return
    const formData = new FormData(e.currentTarget)
    const payload = {
      campaign_id: campaign.id,
      session_number: sessions.length + 1,
      title: formData.get('session_title') || null,
      live_notes: '',
      summary: '',
    }
    const res = await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) { const d = await res.json(); setSessions(prev => [...prev, d]) }
  }

  async function saveLiveNotes() {
    if (!sessions.length) return
    setSavingNotes(true)
    const currentSession = sessions[sessions.length - 1]
    const res = await fetch(`/api/admin/sessions/${currentSession.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ live_notes: liveNotes }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
    }
    setSavingNotes(false)
  }

  function startEditingSession(s: Session) {
    setEditingSessionId(s.id)
    setEditTitle(s.title ?? '')
    setEditSummary(s.summary ?? '')
    setEditNotes(s.live_notes ?? '')
  }

  function cancelEditingSession() {
    setEditingSessionId(null)
  }

  async function saveEditedSession(sessionId: string) {
    setSavingSession(true)
    const res = await fetch(`/api/admin/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle || null,
        summary: editSummary || null,
        live_notes: editNotes || null,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
      // Keep the top Live Notes box in sync if we just edited the current/latest session
      if (sessions.length && sessions[sessions.length - 1].id === updated.id) {
        setLiveNotes(updated.live_notes ?? '')
      }
      setEditingSessionId(null)
    }
    setSavingSession(false)
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Campaign</h1>
      </div>

      {/* Campaign switcher */}
      <div className={styles.formSection}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={isNew ? '' : (campaign?.id ?? '')}
            onChange={e => {
              window.location.href = e.target.value
                ? `/admin/campaign?id=${e.target.value}`
                : '/admin/campaign'
            }}
            style={{ background: 'transparent', color: '#e5d5b0', border: '1px solid #444', padding: '8px 12px', borderRadius: '4px' }}
          >
            {allCampaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.is_active ? ' (active)' : ''}
              </option>
            ))}
          </select>
          <a href="/admin/campaign?new=true" className={styles.saveBtn}>
            + New Campaign
          </a>
        </div>
      </div>

      {/* Campaign setup */}
      <div className={styles.formSection}>
        <h2 className={styles.formSectionTitle}>{campaign ? 'Campaign Settings' : 'Create Campaign'}</h2>
        <form onSubmit={handleCampaignSave}>
          <div className={styles.formGrid}>
            <TextField label="Campaign Name" name="name" defaultValue={campaign?.name ?? ''} required />
            <div />
            <div className={styles.formGridFull}>
              <TextareaField label="Description" name="description" defaultValue={campaign?.description ?? ''} />
            </div>
            <div className={styles.formGridFull}>
              <CheckboxField label="Active Campaign (visible to players)" name="is_active" defaultValue={campaign?.is_active ?? true} />
            </div>
          </div>
          <div className={styles.formActions} style={{ marginTop: '16px' }}>
            <button type="submit" className={styles.saveBtn} disabled={status === 'saving'}>
              {status === 'saving' ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
            </button>
            {status === 'success' && <span className={styles.successMsg}>Saved!</span>}
          </div>
        </form>
      </div>

      {campaign && (
        <>
          {/* Live session notes */}
          <div className={styles.formSection}>
            <h2 className={styles.formSectionTitle}>
              Live Notes — Session {sessions.length}
              <span className={campaignStyles.liveTag}>⬤ Players see this in real time</span>
            </h2>
            <textarea
              value={liveNotes}
              onChange={e => setLiveNotes(e.target.value)}
              className={campaignStyles.liveTextarea}
              placeholder="Write anything here during the session — players can see it live on their Campaign page..."
              rows={8}
            />
            <div className={styles.formActions} style={{ marginTop: '12px' }}>
              <button onClick={saveLiveNotes} className={styles.saveBtn} disabled={savingNotes}>
                {savingNotes ? 'Saving...' : 'Push Live Notes'}
              </button>
            </div>
          </div>

          {/* New session */}
          <div className={styles.formSection}>
            <h2 className={styles.formSectionTitle}>Start New Session</h2>
            <form onSubmit={saveNewSession}>
              <div className={styles.formGrid}>
                <TextField label={`Session ${sessions.length + 1} Title`} name="session_title" />
              </div>
              <div className={styles.formActions} style={{ marginTop: '12px' }}>
                <button type="submit" className={styles.saveBtn}>Begin Session {sessions.length + 1}</button>
              </div>
            </form>
          </div>

          {/* Session history — now editable */}
          {sessions.length > 0 && (
            <div className={styles.formSection}>
              <h2 className={styles.formSectionTitle}>Session History</h2>
              <div className={campaignStyles.sessionList}>
                {[...sessions].reverse().map(s => (
                  <div key={s.id} className={campaignStyles.sessionRow} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    {editingSessionId === s.id ? (
                      <div style={{ padding: '12px 0' }}>
                        <label>Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          style={{ width: '100%', marginBottom: '10px' }}
                        />
                        <label>Summary</label>
                        <textarea
                          value={editSummary}
                          onChange={e => setEditSummary(e.target.value)}
                          rows={3}
                          style={{ width: '100%', marginBottom: '10px' }}
                        />
                        <label>Live Notes</label>
                        <textarea
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          rows={3}
                          style={{ width: '100%', marginBottom: '10px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className={styles.saveBtn}
                            onClick={() => saveEditedSession(s.id)}
                            disabled={savingSession}
                          >
                            {savingSession ? 'Saving...' : 'Save'}
                          </button>
                          <button type="button" className={styles.saveBtn} onClick={cancelEditingSession}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => startEditingSession(s)}
                      >
                        <div>
                          <span className={campaignStyles.sessionNum}>Session {s.session_number}</span>
                          <span className={campaignStyles.sessionTitle}>{s.title || 'Untitled'}</span>
                        </div>
                        <span style={{ fontSize: '11px', opacity: 0.6 }}>Click to edit</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function AdminCampaignPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminCampaignPageInner />
    </Suspense>
  )
}
