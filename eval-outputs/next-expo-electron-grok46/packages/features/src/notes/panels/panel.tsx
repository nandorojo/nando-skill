'use client'

import { Stack } from '@example/design-system/react'
import type { ReactNode } from '@example/libraries/react'
import type { PanelPlacement } from './contract'

export function Panel({ placement, children }: {
  placement: PanelPlacement
  children: ReactNode
}) {
  return <Stack data-placement={placement} className="min-w-0 flex-1">{children}</Stack>
}
