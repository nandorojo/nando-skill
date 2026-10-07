import { createLocalExecution } from '@example/core/execution/node'

const execution = createLocalExecution({ workspace: '/tmp/eval-mock' })

export async function createWindow() {
  void execution
  return { kind: 'mock-window' as const }
}
