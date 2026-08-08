export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase-admin'
import styles from '../shared.module.css'
import dashStyles from '../dashboard.module.css'
import Link from 'next/link'
import CreatePlayerForm from './CreatePlayerForm'

export default async function PlayersPage() {
  const admin = createAdminClient()

  // Fetch all player profiles with their linked character name
  const { data: players } = await admin
    .from('player_profiles')
    .select(`
      id,
      display_name,
      user_id,
      created_at,
      characters ( name )
    `)
    .order('created_at', { ascending: true })

  // Fetch unassigned characters for the create form
  const { data: allChars } = await admin
    .from('characters')
    .select('id, name')
    .eq('is_player_character', true)
    .order('name')

  // Get user emails from auth
  const { data: { users } } = await admin.auth.admin.listUsers()
  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email]))

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Players</h1>
      </div>

      {/* Active players */}
      <div className={dashStyles.section}>
        <h2 className={dashStyles.sectionTitle}>Active Players</h2>

        {!players || players.length === 0 ? (
          <p style={{ color: 'var(--gm-text-dim)', fontStyle: 'italic', fontSize: '14px' }}>
            No players yet. Create one below.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--gm-border)' }}>
            <thead>
              <tr style={{ background: 'var(--gm-panel)' }}>
                {['Display Name', 'Email', 'Character', 'Actions'].map(h => (
                  <th key={h} style={{
                    fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.3em',
                    textTransform: 'uppercase', color: 'var(--gm-gold-dim)', padding: '12px 16px',
                    textAlign: 'left', borderBottom: '1px solid var(--gm-border)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((p: any) => (
                <tr key={p.id} className={styles.adminRow}>
                  <td style={{ padding: '12px 16px', color: 'var(--gm-text)', fontSize: '14px' }}>
                    {p.display_name}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--gm-text-dim)', fontSize: '13px' }}>
                    {emailMap[p.user_id] ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--gm-text-dim)', fontSize: '13px' }}>
                    {(p.characters as any)?.name ?? (
                      <span style={{ color: 'var(--gm-ember)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link
                      href={`/admin/players/${p.id}`}
                      style={{
                        fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: 'var(--gm-gold)', textDecoration: 'none'
                      }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create new player */}
      <div className={dashStyles.section}>
        <h2 className={dashStyles.sectionTitle}>Create Player Account</h2>
        <CreatePlayerForm characters={allChars ?? []} />
      </div>
    </div>
  )
}
