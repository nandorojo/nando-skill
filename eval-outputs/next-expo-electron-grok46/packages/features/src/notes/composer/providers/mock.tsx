'use client'

import type { ReactNode } from '@example/libraries/react'
import type { ComposerContract } from '#features/notes/composer/contract'
import { ComposerProvider } from '#features/notes/composer/context'

export function MockNoteComposerProvider({ value, children }: {
  value: ComposerContract
  children: ReactNode
}) {
  return <ComposerProvider value={value}>{children}</ComposerProvider>
}

export const failedNotePreview = {
  state: { title: 'Inspect this note', body: 'Preview only' },
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
