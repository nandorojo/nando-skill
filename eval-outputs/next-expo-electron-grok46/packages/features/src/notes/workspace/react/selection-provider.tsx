'use client'

import { useState, type ReactNode } from '@example/libraries/react'
import { NoteSelectionProvider, type NoteId } from '../../selection/context'

export function NotesWorkspaceSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<NoteId | null>(null)
  return (
    <NoteSelectionProvider
      value={{
        state: { selectedId },
        actions: { select: setSelectedId },
      }}
    >
      {children}
    </NoteSelectionProvider>
  )
}
