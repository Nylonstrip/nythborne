'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ApprovalActions({ characterId }: { characterId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function setStatus(status: 'approved' | 'rejected') {
    setBusy(true)
    await fetch(`/api/admin/characters/${characterId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approval_status: status }),
    })
    router.refresh()
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <button disabled={busy} onClick={() => setStatus('approved')}>Approve</button>
      <button disabled={busy} onClick={() => setStatus('rejected')} style={{ marginLeft: '8px' }}>Reject</button>
    </div>
  )
}
