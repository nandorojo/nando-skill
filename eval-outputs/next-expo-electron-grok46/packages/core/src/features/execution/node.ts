import type { Event } from './api/schema'
import type { Execution } from './contract'

export function createLocalExecution(_options: { workspace: string }): Execution {
  return {
    async *run(input, { signal }) {
      if (signal.aborted) {
        yield { _tag: 'failed', taskId: input.taskId, reason: 'cancelled' } satisfies Event
        return
      }
      yield {
        _tag: 'output',
        taskId: input.taskId,
        stream: 'stdout',
        text: `mock local execution of ${input.command}`,
      } satisfies Event
      yield { _tag: 'exited', taskId: input.taskId, exitCode: 0 } satisfies Event
    },
  }
}
