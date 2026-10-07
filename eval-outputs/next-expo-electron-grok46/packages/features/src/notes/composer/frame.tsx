'use client'

import { Stack } from '@example/design-system/react'
import type { ReactNode } from '@example/libraries/react'

export function ComposerFrame({ children }: { children: ReactNode }) {
  return <Stack className="gap-2 rounded-xl p-3">{children}</Stack>
}
