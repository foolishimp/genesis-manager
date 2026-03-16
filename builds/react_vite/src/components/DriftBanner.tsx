// Implements: REQ-F-DRIFT-001, REQ-F-DRIFT-002, REQ-F-DRIFT-003, REQ-F-DRIFT-004

import type { DriftBannerProps } from '../types'

export function DriftBanner({ configDrift, installChurn, layoutInconsistencies }: DriftBannerProps) {
  const hasDrift = configDrift !== null || installChurn !== null || layoutInconsistencies.length > 0
  if (!hasDrift) return null

  return (
    <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded m-2 text-sm space-y-1">
      {configDrift && (
        <div className="text-orange-800">
          <span className="font-medium">Config drift:</span> {configDrift.description}
          {' '}(declared: <code>{configDrift.declared}</code>, actual: <code>{configDrift.actual}</code>)
        </div>
      )}
      {installChurn && (
        <div className="text-orange-800">
          <span className="font-medium">Install churn:</span> {installChurn.count} installs
          (last: {installChurn.lastInstallTime})
        </div>
      )}
      {layoutInconsistencies.length > 0 && (
        <div className="text-orange-800">
          <span className="font-medium">Layout inconsistencies:</span>{' '}
          {layoutInconsistencies.join(', ')}
        </div>
      )}
    </div>
  )
}
