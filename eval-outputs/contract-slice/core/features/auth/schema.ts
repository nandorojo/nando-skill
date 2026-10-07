import { schema, type Output } from '../../../library/schema'

// Created by trusted authentication code, never accepted from a request body.
export const Actor = schema.object({
  id: schema.string().min(1),
  teamIds: schema.array(schema.string().min(1)),
}).strict()
export type Actor = Output<typeof Actor>

