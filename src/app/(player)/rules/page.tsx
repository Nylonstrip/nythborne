export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/ui/PageHeader'
import styles from './rules.module.css'
import type { Rule, RuleCategory } from '@/lib/types'

const CATEGORY_LABELS: Record<RuleCategory, string> = {
  nyth_mechanics: 'Nyth Mechanics',
  relic_mechanics: 'Relic Mechanics',
  skills: 'Skills',
  combat: 'Combat',
  general: 'General Rules',
}

const CATEGORY_ORDER: RuleCategory[] = ['nyth_mechanics', 'relic_mechanics', 'skills', 'combat', 'general']

export default async function RulesPage() {
  const { data: rules } = await supabase
    .from('rules')
    .select('*')
    .order('order_index', { ascending: true })

  const byCategory: Partial<Record<RuleCategory, Rule[]>> = {}
  rules?.forEach((rule: Rule) => {
    if (!byCategory[rule.category]) byCategory[rule.category] = []
    byCategory[rule.category]!.push(rule)
  })

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Nythborne System"
        title="Rules"
        description="How the world works mechanically. The Nythborne system is built around two power types and a skill layer. Learn them well."
        count={`${rules?.length ?? 0} rules`}
      />

      {CATEGORY_ORDER.filter(cat => byCategory[cat]?.length).map(category => (
        <section key={category} className={styles.section}>
          <h2 className={styles.categoryTitle}>{CATEGORY_LABELS[category]}</h2>
          <div className={styles.ruleList}>
            {byCategory[category]!.map((rule: Rule) => (
              <div key={rule.id} className={styles.rule}>
                <h3 className={styles.ruleTitle}>{rule.title}</h3>
                <p className={styles.ruleContent}>{rule.content}</p>
                {rule.examples && (
                  <div className={styles.examples}>
                    <span className={styles.examplesLabel}>Example</span>
                    <p>{rule.examples}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {(!rules || rules.length === 0) && (
        <div className={styles.empty}>
          <p>No rules have been published yet.</p>
        </div>
      )}
    </div>
  )
}
