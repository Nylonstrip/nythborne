export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createPlayerServerClient } from '@/lib/supabase-server'
import styles from './player.module.css'

export default async function PlayerPage() {
  const supabase = await createPlayerServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/player/login')

  // Fetch player profile + character
  const { data: profile } = await supabase
    .from('player_profiles')
    .select(`
      display_name,
      character_id,
      characters (
        name,
        background,
        personality_basis,
        current_condition,
        wish,
        manifestation_name,
        manifestation_description,
        crystalline_form,
        overuse_effects
      )
    `)
    .eq('user_id', user.id)
    .single()

  const character = profile?.characters as unknown as Record<string, string> | null

  return (
    <div className={styles.shell}>
      <div className={styles.bgStars} aria-hidden="true" />
      <div className={styles.bgVignette} aria-hidden="true" />
      <div className={styles.bgScanlines} aria-hidden="true" />

      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.eyebrow}>Astraea</span>
            <h1 className={styles.title}>
              {character?.name ?? profile?.display_name ?? 'Unknown'}
            </h1>
          </div>
          <a href="/api/player/logout" className={styles.logout}>
            Leave World
          </a>
        </header>

        {!character ? (
      <div className={styles.noChar}>
        <p>Your character has not been assigned yet. The All Mother is still writing your story.</p>
        <a href="/characters/new" className={styles.logout}>
          Create Your Character
        </a>
      </div>
      ) : (
          <div className={styles.grid}>

            {/* Identity */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Identity</h2>
              <div className={styles.cardBody}>
                {character.background && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Background</span>
                    <p className={styles.fieldValue}>{character.background}</p>
                  </div>
                )}
                {character.personality_basis && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Personality</span>
                    <p className={styles.fieldValue}>{character.personality_basis}</p>
                  </div>
                )}
                {character.current_condition && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Current Condition</span>
                    <p className={styles.fieldValue}>{character.current_condition}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Nyth details — only shown if wish exists */}
            {character.wish && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Nyth</h2>
                <div className={styles.cardBody}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Wish</span>
                    <p className={styles.fieldValue}>{character.wish}</p>
                  </div>
                  {character.manifestation_name && (
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Manifestation</span>
                      <p className={styles.fieldValue}>
                        {character.manifestation_name}
                        {character.manifestation_description && ` — ${character.manifestation_description}`}
                      </p>
                    </div>
                  )}
                  {character.crystalline_form && (
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Crystalline Form</span>
                      <p className={styles.fieldValue}>{character.crystalline_form}</p>
                    </div>
                  )}
                  {character.overuse_effects && (
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Overuse Effects</span>
                      <p className={styles.fieldValue}>{character.overuse_effects}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
