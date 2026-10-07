import { DeploymentStatus } from '../../../core/features/deployments/schema'

// Domain meaning is shared. The design system maps semantic tones to colors.
const display = {
  queued: { label: 'Queued', tone: 'neutral' },
  building: { label: 'Building', tone: 'info' },
  ready: { label: 'Ready', tone: 'positive' },
  failed: { label: 'Failed', tone: 'critical' },
} as const satisfies Record<DeploymentStatus, { label: string; tone: string }>

export function getDisplayStatus(status: DeploymentStatus) {
  return Object.freeze({ ...display[DeploymentStatus.parse(status)] })
}
