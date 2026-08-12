import { redirect } from 'next/navigation'
import { createPlayerServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import styles from './player-nav.module.css'

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createPlayerServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className={styles.wrap}>
      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.brand}>Astraea</Link>
        <div className={styles.links}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/character">Character</Link>
          <Link href="/play">Play</Link>
          <Link href="/nations">Nations</Link>
          <Link href="/relics">Relics</Link>
          <Link href="/rules">Rules</Link>
          <Link href="/history">History</Link>
          <Link href="/world">World</Link>
          <Link href="/campaign">Campaign</Link>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
