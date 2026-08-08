'use client'
import { useState, useEffect } from 'react'
import styles from '@/app/admin/shared.module.css'
import campaignStyles from './campaign.module.css'
import { TextareaField, TextField, CheckboxField } from '@/components/admin/FormFields'

interface Campaign { id: string; name: string; description: string; is_active: boolean; current_session: number }
interface Session { id: string; session_number: number; title: string; summary: string; live_notes: string }

export default function AdminCampaignPage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [liveNotes, setLiveNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    fetch('/api/admin/campaign').then(r => r.json()).then(d => {
      if (d.campaign) { setCampaign(d.campaign); setSessions(d.sessions ?? []) }
      if (d.currentSession?.live_notes) setLiveNotes(d.currentSession.live_notes)
    })
  }, [])

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
    if (res.ok) { const d = await res.json(); setCampaign(d); setStatus('success') }
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
    await fetch(`/api/admin/sessions/${currentSession.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ live_notes: liveNotes }),
    })
    setSavingNotes(false)
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Campaign</h1>
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

          {/* Session history */}
          {sessions.length > 0 && (
            <div className={styles.formSection}>
              <h2 className={styles.formSectionTitle}>Session History</h2>
              <div className={campaignStyles.sessionList}>
                {[...sessions].reverse().map(s => (
                  <div key={s.id} className={campaignStyles.sessionRow}>
                    <span className={campaignStyles.sessionNum}>Session {s.session_number}</span>
                    <span className={campaignStyles.sessionTitle}>{s.title || 'Untitled'}</span>
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
