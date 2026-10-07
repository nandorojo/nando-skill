import { schema, type Output } from '../../../library/schema'

export const DeploymentStatus = schema.enum(['queued', 'building', 'ready', 'failed'])
export type DeploymentStatus = Output<typeof DeploymentStatus>

