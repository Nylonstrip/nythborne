import Link from 'next/link'
import styles from './admin.module.css'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/nations', label: 'Nations' },
  { href: '/admin/characters', label: 'Characters' },
  { href: '/admin/relics', label: 'Relics' },
  { href: '/admin/timeline', label: 'Timeline' },
  { href: '/admin/rules', label: 'Rules' },
  { href: '/admin/campaign', label: 'Campaign' },
  { href: '/admin/connections', label: 'Connections' },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/players', label: 'Players' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>

      {/* Atmospheric background layers */}
      <div className={styles.bgBase} aria-hidden="true" />
      <div className={styles.bgGrid} aria-hidden="true" />
      <div className={styles.bgVignette} aria-hidden="true" />
      <div className={styles.bgScanlines} aria-hidden="true" />

      {/* Floating sigil orbs */}
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />
      <div className={styles.orb3} aria-hidden="true" />

      <aside className={styles.sidebar}>
        {/* Power line accent */}
        <div className={styles.sidebarPowerLine} aria-hidden="true" />

        <div className={styles.sidebarLogo}>
          <div className={styles.logoEyepiece} aria-hidden="true">
            <div className={styles.logoEyeInner} />
          </div>
          <span className={styles.logoMain}>NYTHBORNE</span>
          <span className={styles.logoSub}>All Mother Interface</span>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.navItem}>
              <span className={styles.navAccent} aria-hidden="true" />
              <span className={styles.navLabel}>{label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerDivider} aria-hidden="true" />
          <Link href="/world" className={styles.viewSite}>
            <span>↗</span> Player Portal
          </Link>
          <Link href="/api/admin/logout" className={styles.logout}>
            Sever Connection
          </Link>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          {children}
        </div>
      </main>
    </div>
  )
}
