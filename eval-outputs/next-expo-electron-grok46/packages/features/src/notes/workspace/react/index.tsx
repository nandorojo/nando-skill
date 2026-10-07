'use client'

import type { ReactNode } from '@example/libraries/react'
import { NotesWorkspacePanelsProvider } from './panels-provider'
import { NotesWorkspaceSelectionProvider } from './selection-provider'

export function NotesWorkspaceProvider({ children }: { children: ReactNode }) {
  return (
    <NotesWorkspacePanelsProvider>
      <NotesWorkspaceSelectionProvider>
        {children}
      </NotesWorkspaceSelectionProvider>
    </NotesWorkspacePanelsProvider>
  )
}
