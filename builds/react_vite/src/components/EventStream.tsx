// Implements: REQ-F-EVT-001, REQ-F-EVT-002, REQ-F-EVT-003, REQ-F-EVT-004
// Implements: REQ-F-EVT-005, REQ-F-EVT-006, REQ-F-EVT-007

import { useState } from 'react'
import type { WorkspaceEvent, EventListProps, FocusedEntity } from '../types'

function EventDetail({ event, onClose }: { event: WorkspaceEvent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-10">
      <div className="bg-white rounded shadow-lg p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-mono font-medium">{event.event_type}</div>
            <div className="text-xs text-gray-500">#{event.seq} — {event.event_time}</div>
          </div>
          <button className="text-gray-400 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
          {JSON.stringify(event.data, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function EventRow({
  event,
  isNew,
  onSelect,
  onFocus,
}: {
  event: WorkspaceEvent
  isNew: boolean
  onSelect: (e: WorkspaceEvent) => void
  onFocus: (entity: FocusedEntity) => void
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 text-sm border-b cursor-pointer hover:bg-gray-50 ${
        isNew ? 'bg-blue-50' : ''
      }`}
      onClick={() => onSelect(event)}
    >
      {isNew && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
      <span className="font-mono text-xs text-gray-400 w-8">{event.seq}</span>
      <span className="font-mono text-xs text-gray-500 w-40 truncate">{event.event_time}</span>
      <span className="font-mono text-xs flex-1 truncate">{event.event_type}</span>
      {event.edge && (
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            onFocus({ type: 'edge', name: event.edge! })
          }}
        >
          {event.edge}
        </button>
      )}
    </div>
  )
}

interface WatermarkControlProps {
  unreadCount: number
  onMarkSeen: () => void
}

function WatermarkControl({ unreadCount, onMarkSeen }: WatermarkControlProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50">
      {unreadCount > 0 && (
        <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
          {unreadCount}
        </span>
      )}
      <button
        className="text-xs text-blue-600 hover:underline disabled:opacity-40"
        disabled={unreadCount === 0}
        onClick={onMarkSeen}
      >
        Mark all seen
      </button>
    </div>
  )
}

interface EventStreamProps extends EventListProps {
  onFocus: (entity: FocusedEntity) => void
}

export function EventStream({
  events,
  watermarkSeq,
  onMarkSeen,
  filter,
  onFocus,
}: EventStreamProps) {
  const [selected, setSelected] = useState<WorkspaceEvent | null>(null)
  const [typeFilter, setTypeFilter] = useState(filter?.type ?? '')

  const filtered = typeFilter
    ? events.filter((e) => e.event_type.includes(typeFilter))
    : events

  const unreadCount = events.filter((e) => e.seq > watermarkSeq).length

  return (
    <div className="flex flex-col h-full">
      <WatermarkControl unreadCount={unreadCount} onMarkSeen={onMarkSeen} />

      {/* Filter controls — REQ-F-EVT-005 */}
      <div className="px-3 py-2 border-b">
        <input
          className="border rounded px-2 py-1 text-xs w-full"
          placeholder="Filter by event type…"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No events</div>
        ) : (
          [...filtered].reverse().map((e) => (
            <EventRow
              key={e.seq}
              event={e}
              isNew={e.seq > watermarkSeq}
              onSelect={setSelected}
              onFocus={onFocus}
            />
          ))
        )}
      </div>

      {selected && (
        <EventDetail event={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
