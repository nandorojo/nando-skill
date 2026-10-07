'use client'

import { Stack } from '@example/design-system/react'
import type { ReactNode } from '@example/libraries/react'

export function PanelsRoot({ children }: { children: ReactNode }) {
  return <Stack className="flex-row gap-4">{children}</Stack>
}
