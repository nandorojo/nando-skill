'use client'

import { useState, type ReactNode } from '@example/libraries/react'
import { PanelsProvider } from '../../panels/context'
import type { PanelsContract } from '../../panels/contract'

export function NotesWorkspacePanelsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PanelsContract['state']>({
    order: ['list', 'editor'],
  })
  const value: PanelsContract = {
    state,
    actions: {
      move(placement, index) {
        setState(current => {
          const next = current.order.filter(item => item !== placement)
          next.splice(index, 0, placement)
          return { order: next }
        })
      },
    },
  }
  return <PanelsProvider value={value}>{children}</PanelsProvider>
}
