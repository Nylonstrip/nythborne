import { createAdminClient } from '@/lib/supabase-admin'
import ApprovalActions from './ApprovalActions'

export default async function ApprovalsPage() {
  const admin = createAdminClient()
  const { data: pending, error } = await admin
    .from('characters')
    .select('*')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    return <p>Error loading approvals: {error.message}</p>
  }

  return (
    <div>
      <h1>Character Approvals</h1>
      {(!pending || pending.length === 0) && <p>No pending submissions.</p>}

      {pending?.map((char) => (
        <div key={char.id} style={{ border: '1px solid #333', padding: '16px', marginBottom: '12px' }}>
          <h3>{char.name}</h3>
          <p><strong>Wish:</strong> {char.wish}</p>
          <p><strong>Manifestation:</strong> {char.manifestation_name}</p>
          {char.manifestation_description && <p>{char.manifestation_description}</p>}
          {char.background && <p><strong>Background:</strong> {char.background}</p>}
          <ApprovalActions characterId={char.id} />
        </div>
      ))}
    </div>
  )
}
