'use client'

import type { ReactNode } from '@example/libraries/react'
import type { ComposerContract } from '#features/tasks/composer/contract'
import { ComposerProvider } from '#features/tasks/composer/context'

export function MockTaskComposerProvider({ value, children }: {
  value: ComposerContract
  children: ReactNode
}) {
  return <ComposerProvider value={value}>{children}</ComposerProvider>
}

export const failedTaskPreview = {
  state: { title: 'Inspect this task', description: 'Preview only', status: 'open' },
  meta: {
    submission: { kind: 'failed', message: 'Connection lost' },
    canSubmit: true,
    inputRef: { current: null },
  },
  actions: {
    patch() {},
    replace() {},
    reset() {},
    async submit() {
      return { kind: 'rejected', message: 'Preview only' }
    },
  },
} satisfies ComposerContract
