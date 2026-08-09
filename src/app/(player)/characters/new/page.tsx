'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlayerClient } from '@/lib/supabase'

export default function NewCharacterPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget) // capture BEFORE any await — currentTarget goes stale after
    setStatus('saving')
    setErrorMsg('')

    const supabase = createPlayerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('Not logged in.')
      setStatus('error')
      return
    }
    const payload = {
      name: formData.get('name'),
      is_player_character: true,
      approval_status: 'pending',
      submitted_by: user.id, // <-- new: lets RLS allow reading this row back immediately
      wish: formData.get('wish'),
      manifestation_name: formData.get('manifestation_name'),
      manifestation_description: formData.get('manifestation_description') || null,
      background: formData.get('background') || null,
      visibility: 'hidden',
    }

    const { data: newChar, error: insertError } = await supabase
      .from('characters')
      .insert(payload)
      .select()
      .single()

    if (insertError) {
      setErrorMsg(insertError.message)
      setStatus('error')
      return
    }

    const { error: linkError } = await supabase
      .from('player_profiles')
      .update({ character_id: newChar.id })
      .eq('user_id', user.id)

    if (linkError) {
      setErrorMsg(linkError.message)
      setStatus('error')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      <h1>Submit Your Character</h1>
      <p>Your submission will be reviewed by the GM before it appears in the world.</p>

      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input type="text" name="name" required />

        <label>Wish (what drives them)</label>
        <input type="text" name="wish" required />

        <label>Manifestation Name</label>
        <input type="text" name="manifestation_name" required />

        <label>Manifestation Description</label>
        <textarea name="manifestation_description" rows={3} />

        <label>Background</label>
        <textarea name="background" rows={4} />

        <button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Submitting...' : 'Submit for Approval'}
        </button>
        {status === 'error' && <p style={{ color: 'red' }}>{errorMsg}</p>}
      </form>
    </div>
  )
}
