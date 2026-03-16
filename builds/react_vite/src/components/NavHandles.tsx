// Implements: REQ-F-NAV-001, REQ-F-NAV-002, REQ-F-NAV-003, REQ-F-NAV-004, REQ-F-NAV-005

import type { FocusedEntity } from '../types'

interface NavLinkProps {
  entity: FocusedEntity
  onFocus: (entity: FocusedEntity) => void
  children: React.ReactNode
}

export function NavLink({ entity, onFocus, children }: NavLinkProps) {
  return (
    <button
      className="text-blue-600 hover:underline cursor-pointer bg-transparent border-0 p-0 font-inherit"
      onClick={() => onFocus(entity)}
    >
      {children}
    </button>
  )
}

interface ReqKeyLinkProps {
  reqKey: string
  onFocus: (entity: FocusedEntity) => void
}

export function ReqKeyLink({ reqKey, onFocus }: ReqKeyLinkProps) {
  return (
    <NavLink entity={{ type: 'req', key: reqKey }} onFocus={onFocus}>
      {reqKey}
    </NavLink>
  )
}

interface EdgeLinkProps {
  edgeName: string
  onFocus: (entity: FocusedEntity) => void
}

export function EdgeLink({ edgeName, onFocus }: EdgeLinkProps) {
  return (
    <NavLink entity={{ type: 'edge', name: edgeName }} onFocus={onFocus}>
      {edgeName}
    </NavLink>
  )
}

interface EventLinkProps {
  seq: number
  onFocus: (entity: FocusedEntity) => void
}

export function EventLink({ seq, onFocus }: EventLinkProps) {
  return (
    <NavLink entity={{ type: 'event', seq }} onFocus={onFocus}>
      #{seq}
    </NavLink>
  )
}

interface FeatureLinkProps {
  featureId: string
  onFocus: (entity: FocusedEntity) => void
}

export function FeatureLink({ featureId, onFocus }: FeatureLinkProps) {
  return (
    <NavLink entity={{ type: 'feature', id: featureId }} onFocus={onFocus}>
      {featureId}
    </NavLink>
  )
}

interface EvaluatorLinkProps {
  name: string
  edge: string
  onFocus: (entity: FocusedEntity) => void
}

export function EvaluatorLink({ name, edge, onFocus }: EvaluatorLinkProps) {
  return (
    <NavLink entity={{ type: 'evaluator', name, edge }} onFocus={onFocus}>
      {name}
    </NavLink>
  )
}
