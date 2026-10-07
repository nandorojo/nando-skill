import type { Event, Run } from './api/schema'

export type Execution = {
  run(
    input: typeof Run.Type,
    options: { signal: AbortSignal },
  ): AsyncIterable<typeof Event.Type>
}
