// Implements: REQ-F-SPEC-001, REQ-F-SPEC-002, REQ-F-SPEC-003, REQ-F-SPEC-004
// Implements: REQ-F-SPEC-005, REQ-F-SPEC-006

import type { DomainModel, EdgeGap, FocusedEntity } from '../types'

interface GraphTopologyViewProps {
  domain: DomainModel
  gapsByEdge: Map<string, EdgeGap>
  onFocus: (entity: FocusedEntity) => void
}

const NODE_W = 120
const NODE_H = 40
const PAD_X = 160
const PAD_Y = 80
const MARGIN = 40

function edgeKey(source: string, target: string): string {
  return `${source}→${target}`
}

export function GraphTopologyView({ domain, gapsByEdge, onFocus }: GraphTopologyViewProps) {
  const assets = domain.package.assets
  const edges = domain.package.edges

  // Layout: simple left-to-right chain
  const positions = new Map<string, { x: number; y: number }>()
  assets.forEach((a, i) => {
    positions.set(a.name, { x: MARGIN + i * PAD_X, y: MARGIN + PAD_Y })
  })

  const svgWidth = MARGIN * 2 + Math.max(assets.length - 1, 0) * PAD_X + NODE_W
  const svgHeight = PAD_Y * 2 + NODE_H + MARGIN

  return (
    <div className="border rounded bg-gray-900 overflow-auto">
      <svg width={svgWidth} height={svgHeight}>
        {/* Edges */}
        {edges.map((e) => {
          const from = positions.get(e.source)
          const to = positions.get(e.target)
          if (!from || !to) return null
          const gap = gapsByEdge.get(edgeKey(e.source, e.target))
          const color = gap ? (gap.delta === 0 ? '#16a34a' : '#dc2626') : '#6b7280'
          const x1 = from.x + NODE_W
          const y1 = from.y + NODE_H / 2
          const x2 = to.x
          const y2 = to.y + NODE_H / 2
          const label = edgeKey(e.source, e.target)
          return (
            <g key={label}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} />
              <text
                x={(x1 + x2) / 2}
                y={y1 - 8}
                textAnchor="middle"
                fontSize={10}
                fill={color}
                style={{ cursor: 'pointer' }}
                onClick={() => onFocus({ type: 'edge', name: label })}
              >
                {gap ? `Δ${gap.delta}` : ''}
              </text>
            </g>
          )
        })}
        {/* Nodes */}
        {assets.map((a) => {
          const pos = positions.get(a.name)
          if (!pos) return null
          return (
            <g
              key={a.name}
              style={{ cursor: 'pointer' }}
              onClick={() => onFocus({ type: 'edge', name: a.name })}
            >
              <rect
                x={pos.x}
                y={pos.y}
                width={NODE_W}
                height={NODE_H}
                rx={6}
                fill="#eff6ff"
                stroke="#3b82f6"
                strokeWidth={1.5}
              />
              <text
                x={pos.x + NODE_W / 2}
                y={pos.y + NODE_H / 2 + 4}
                textAnchor="middle"
                fontSize={12}
                fill="#1e40af"
              >
                {a.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
