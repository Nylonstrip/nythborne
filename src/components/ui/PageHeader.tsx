import styles from './PageHeader.module.css'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  count?: string
}

export default function PageHeader({ eyebrow, title, description, count }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {count && <span className={styles.count}>{count}</span>}
      </div>
      {description && <p className={styles.desc}>{description}</p>}
      <div className={styles.rule} />
    </div>
  )
}
