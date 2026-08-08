'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './connections.module.css'

interface NodeData {
  id: string
  label: string
  table: string
  visibility: string
  x: number
  y: number
  vx: number
  vy: number
}

interface LinkData {
  from: string
  to: string
  relationship: string
  notes: string | null
}

const TABLE_COLORS: Record<string, { fill: string; stroke: string }> = {
  characters:           { fill: '#534AB7', stroke: '#AFA9EC' },
  timeline_events: { fill: '#0F6E56', stroke: '#5DCAA5' },
  rules:           { fill: '#854F0B', stroke: '#EF9F27' },
  factions:        { fill: '#993C1D', stroke: '#F0997B' },
}

export default function ConnectionsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<NodeData[]>([])
  const linksRef = useRef<LinkData[]>([])
  const selectedRef = useRef<NodeData | null>(null)
  const draggingRef = useRef<NodeData | null>(null)
  const dragOffRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)

  const [selected, setSelected] = useState<NodeData | null>(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: NodeData } | null>(null)
  const filterRef = useRef('all')

  useEffect(() => { filterRef.current = filter }, [filter])
  useEffect(() => { selectedRef.current = selected }, [selected])

  // Fetch links from API
  useEffect(() => {
    fetch('/api/admin/connections')
      .then(r => r.json())
      .then(data => {
        const nodeMap = new Map<string, NodeData>()
        data.links.forEach((l: { from_table: string; from_id: string; from_name: string; to_table: string; to_id: string; to_name: string; relationship: string; notes: string }) => {
          if (!nodeMap.has(l.from_id)) {
            nodeMap.set(l.from_id, { id: l.from_id, label: l.from_name, table: l.from_table, visibility: 'hidden', x: 0, y: 0, vx: 0, vy: 0 })
          }
          if (!nodeMap.has(l.to_id)) {
            nodeMap.set(l.to_id, { id: l.to_id, label: l.to_name, table: l.to_table, visibility: 'hidden', x: 0, y: 0, vx: 0, vy: 0 })
          }
        })

        // Merge visibility from nodes data
        data.nodes.forEach((n: { id: string; visibility: string }) => {
          if (nodeMap.has(n.id)) nodeMap.get(n.id)!.visibility = n.visibility
        })

        const nodes = Array.from(nodeMap.values())
        const W = wrapRef.current?.clientWidth || 800
        const H = wrapRef.current?.clientHeight || 500
        const cx = W / 2, cy = H / 2

        // Initial layout — spread in a circle
        nodes.forEach((n, i) => {
          const angle = (i / nodes.length) * Math.PI * 2
          const r = Math.min(W, H) * 0.33
          n.x = cx + Math.cos(angle) * r + (Math.random() - 0.5) * 40
          n.y = cy + Math.sin(angle) * r + (Math.random() - 0.5) * 40
        })

        nodesRef.current = nodes
        linksRef.current = data.links.map((l: { from_id: string; to_id: string; relationship: string; notes: string }) => ({
          from: l.from_id, to: l.to_id, relationship: l.relationship, notes: l.notes
        }))
        setLoading(false)
      })
  }, [])

  const getVisible = useCallback(() => {
    const f = filterRef.current
    const nodes = f === 'all' ? nodesRef.current : nodesRef.current.filter(n => n.table === f)
    const ids = new Set(nodes.map(n => n.id))
    const links = linksRef.current.filter(l => ids.has(l.from) && ids.has(l.to))
    return { nodes, links }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    ctx.clearRect(0, 0, W, H)

    const { nodes, links } = getVisible()
    const nodeMap = Object.fromEntries(nodesRef.current.map(n => [n.id, n]))
    const sel = selectedRef.current

    // Draw links
    links.forEach(l => {
      const a = nodeMap[l.from], b = nodeMap[l.to]
      if (!a || !b) return
      const isHighlight = sel && (sel.id === l.from || sel.id === l.to)
      const col = isHighlight ? (TABLE_COLORS[a.table]?.stroke || '#aaa') : (dark ? '#333' : '#ccc')
      const alpha = isHighlight ? 0.9 : 0.35

      const dx = b.x - a.x, dy = b.y - a.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < 1) return
      const nx = dx / d, ny = dy / d
      const sx = a.x + nx * 20, sy = a.y + ny * 20
      const ex = b.x - nx * 22, ey = b.y - ny * 22

      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(ex, ey)
      ctx.strokeStyle = col
      ctx.lineWidth = isHighlight ? 1.5 : 0.75
      ctx.globalAlpha = alpha
      ctx.stroke()

      // Arrowhead
      const ax2 = ex - nx * 8 + ny * 4, ay2 = ey - ny * 8 - nx * 4
      const bx2 = ex - nx * 8 - ny * 4, by2 = ey - ny * 8 + nx * 4
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(ax2, ay2)
      ctx.lineTo(bx2, by2)
      ctx.closePath()
      ctx.fillStyle = col
      ctx.fill()
      ctx.globalAlpha = 1

      // Relationship label on highlighted links
      if (isHighlight) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        ctx.font = '10px var(--font-sans, sans-serif)'
        ctx.fillStyle = dark ? '#aaa' : '#666'
        ctx.textAlign = 'center'
        ctx.globalAlpha = 0.9
        ctx.fillText(l.relationship, mx, my - 6)
        ctx.globalAlpha = 1
      }
    })

    // Draw nodes
    nodes.forEach(n => {
      const c = TABLE_COLORS[n.table] || TABLE_COLORS.characters
      const isHidden = n.visibility === 'hidden'
      const isSel = sel && sel.id === n.id
      const isLinked = sel && links.some(l => (l.from === sel.id && l.to === n.id) || (l.to === sel.id && l.from === n.id))
      const isDimmed = sel && !isSel && !isLinked

      const r = isSel ? 22 : isLinked ? 18 : 15
      let fill = c.fill
      let stroke = c.stroke

      if (isDimmed) {
        fill = dark ? '#1a1a1a' : '#ddd'
        stroke = dark ? '#444' : '#bbb'
      } else if (isHidden && !isSel && !isLinked) {
        fill = dark ? '#1e2435' : '#c8cfe0'
        stroke = dark ? '#3a4460' : '#9aa3bc'
      }

      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
      ctx.strokeStyle = stroke
      ctx.lineWidth = isSel ? 2.5 : 1.5
      ctx.stroke()

      // Label
      ctx.font = '500 11px var(--font-sans, sans-serif)'
      ctx.textAlign = 'center'
      ctx.fillStyle = isDimmed ? (dark ? '#444' : '#bbb') : (dark ? '#ddd' : '#fff')
      ctx.globalAlpha = isDimmed ? 0.4 : 1

      const words = n.label.split(' ')
      const lines: string[] = []
      let line = ''
      for (const w of words) {
        const test = line ? line + ' ' + w : w
        if (ctx.measureText(test).width > 88 && line) { lines.push(line); line = w }
        else line = test
      }
      if (line) lines.push(line)

      const lineH = 13
      lines.forEach((ln, i) => {
        ctx.fillText(ln, n.x, n.y + r + 10 + i * lineH)
      })
      ctx.globalAlpha = 1
    })
  }, [getVisible])

  // Force simulation tick
  const tick = useCallback(() => {
    const nodes = nodesRef.current
    const links = linksRef.current
    const W = canvasRef.current?.width || 800
    const H = canvasRef.current?.height || 500

    nodes.forEach(n => {
      // Repulsion between nodes
      nodes.forEach(m => {
        if (m.id === n.id) return
        const dx = n.x - m.x, dy = n.y - m.y
        const d = Math.sqrt(dx * dx + dy * dy) + 0.01
        if (d < 160) {
          const f = 80 / (d * d)
          n.vx += dx * f; n.vy += dy * f
        }
      })

      // Attraction toward center
      n.vx += (W / 2 - n.x) * 0.001
      n.vy += (H / 2 - n.y) * 0.001
    })

    // Attraction along links
    links.forEach(l => {
      const a = nodes.find(n => n.id === l.from)
      const b = nodes.find(n => n.id === l.to)
      if (!a || !b) return
      const dx = b.x - a.x, dy = b.y - a.y
      const d = Math.sqrt(dx * dx + dy * dy) + 0.01
      const ideal = 160
      const f = (d - ideal) * 0.008
      const fx = (dx / d) * f, fy = (dy / d) * f
      a.vx += fx; a.vy += fy
      b.vx -= fx; b.vy -= fy
    })

    // Integrate
    nodes.forEach(n => {
      if (draggingRef.current?.id === n.id) return
      n.vx *= 0.8; n.vy *= 0.8
      n.x += n.vx; n.y += n.vy
      n.x = Math.max(30, Math.min(W - 30, n.x))
      n.y = Math.max(30, Math.min(H - 30, n.y))
    })

    draw()
    rafRef.current = requestAnimationFrame(tick)
  }, [draw])

  useEffect(() => {
    if (!loading) {
      rafRef.current = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(rafRef.current)
    }
  }, [loading, tick])

  // Resize
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      const wrap = wrapRef.current
      if (!canvas || !wrap) return
      canvas.width = wrap.clientWidth
      canvas.height = wrap.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Mouse events
  const getNodeAt = (x: number, y: number) => {
    const { nodes } = getVisible()
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i]
      const dx = x - n.x, dy = y - n.y
      if (dx * dx + dy * dy <= 24 * 24) return n
    }
    return null
  }

  const onMouseMove = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    if (draggingRef.current) {
      draggingRef.current.x = x - dragOffRef.current.x
      draggingRef.current.y = y - dragOffRef.current.y
      return
    }
    const n = getNodeAt(x, y)
    setTooltip(n ? { x, y, node: n } : null)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    const n = getNodeAt(x, y)
    if (n) {
      draggingRef.current = n
      dragOffRef.current = { x: x - n.x, y: y - n.y }
    }
  }

  const onMouseUp = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    if (draggingRef.current) {
      const moved = Math.abs(x - (draggingRef.current.x + dragOffRef.current.x)) > 4
        || Math.abs(y - (draggingRef.current.y + dragOffRef.current.y)) > 4
      if (!moved) {
        const n = draggingRef.current
        const next = selected?.id === n.id ? null : n
        setSelected(next)
        selectedRef.current = next
      }
      draggingRef.current = null
    }
  }

  const selectedLinks = selected
    ? linksRef.current.filter(l => l.from === selected.id || l.to === selected.id)
    : []
  const nodeMap = Object.fromEntries(nodesRef.current.map(n => [n.id, n]))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lore Connections</h1>
        <p className={styles.subtitle}>
          {nodesRef.current.length} entries · {linksRef.current.length} connections
        </p>
      </div>

      <div className={styles.filters}>
        {['all', 'characters', 'timeline_events', 'rules', 'factions'].map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
            onClick={() => { setFilter(f); filterRef.current = f; setSelected(null); selectedRef.current = null }}
          >
            {f === 'all' ? 'All' : f === 'timeline_events' ? 'Timeline' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.canvasWrap} ref={wrapRef}>
        {loading && <div className={styles.loading}>Loading connections...</div>}
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseMove={onMouseMove}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { draggingRef.current = null; setTooltip(null) }}
          style={{ cursor: tooltip ? 'grab' : 'default' }}
        />
        {tooltip && (
          <div className={styles.tooltip} style={{
            left: Math.min(tooltip.x + 14, (wrapRef.current?.clientWidth || 800) - 280),
            top: Math.min(tooltip.y - 10, (wrapRef.current?.clientHeight || 500) - 100),
          }}>
            <div className={styles.tooltipTitle}>{tooltip.node.label}</div>
            <div className={styles.tooltipMeta}>
              {tooltip.node.table.replace('_', ' ')} · {tooltip.node.visibility}
            </div>
          </div>
        )}
      </div>

      <div className={styles.legend}>
        {Object.entries(TABLE_COLORS).map(([table, c]) => (
          <div key={table} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: c.fill, border: `1.5px solid ${c.stroke}` }} />
            <span>{table === 'timeline_events' ? 'Timeline' : table.charAt(0).toUpperCase() + table.slice(1)}</span>
          </div>
        ))}
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#1e2435', border: '1.5px solid #3a4460' }} />
          <span>Hidden entry</span>
        </div>
      </div>

      <div className={styles.detail}>
        {!selected ? (
          <p className={styles.detailEmpty}>Click a node to see its connections.</p>
        ) : (
          <>
            <div className={styles.detailHeader}>
              <span className={styles.detailName}>{selected.label}</span>
              <span className={styles.detailMeta}>
                {selected.table.replace('_', ' ')} · {selected.visibility} · {selectedLinks.length} connection{selectedLinks.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className={styles.detailLinks}>
              {selectedLinks.map((l, i) => {
                const other = nodeMap[l.from === selected.id ? l.to : l.from]
                if (!other) return null
                const dir = l.from === selected.id ? '→' : '←'
                const c = TABLE_COLORS[other.table]
                return (
                  <div key={i} className={styles.detailLink}>
                    <span className={styles.detailDir}>{dir}</span>
                    <span className={styles.detailOther} style={{ color: c?.stroke }}>{other.label}</span>
                    <span className={styles.detailRel}>({l.relationship})</span>
                    {l.notes && <p className={styles.detailNotes}>{l.notes}</p>}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
