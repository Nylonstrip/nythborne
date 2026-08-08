import { redirect } from 'next/navigation'
import { createPlayerServerClient } from '@/lib/supabase-server'

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createPlayerServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <>{children}</>
}
