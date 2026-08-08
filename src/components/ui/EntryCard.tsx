import Link from 'next/link'
import styles from './EntryCard.module.css'

interface EntryCardProps {
  href: string
  tag: string
  name: string
  description: string
  badge?: string
  accentColor?: string
}

export default function EntryCard({ href, tag, name, description, badge, accentColor }: EntryCardProps) {
  return (
    <Link href={href} className={styles.card} style={{ '--accent': accentColor } as React.CSSProperties}>
      <span className={styles.tag}>{tag}</span>
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.desc}>{description}</p>
      {badge && <span className={styles.badge}>{badge}</span>}
    </Link>
  )
}
