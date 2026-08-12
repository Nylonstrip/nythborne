import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {

  const { displayName, email, password, characterId } = await req.json()

  if (!displayName || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification — GM is creating this account
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user.' }, { status: 500 })
  }

  // Create player profile
  const { error: profileError } = await admin
    .from('player_profiles')
    .insert({
      user_id: authData.user.id,
      display_name: displayName,
      character_id: characterId ?? null,
    })

  if (profileError) {
    // Clean up auth user if profile creation failed
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
