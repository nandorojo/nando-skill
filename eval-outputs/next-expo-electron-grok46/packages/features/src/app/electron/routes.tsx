'use client'

import { ElectronAppProvider } from '#features/app/electron/provider'
import { ElectronExistingNotePage, ElectronNewNotePage } from '#features/notes/electron/index'
import { ElectronExistingTaskPage, ElectronNewTaskPage } from '#features/tasks/electron/index'
import type { ReactNode } from '@example/libraries/react'

export function ElectronApp({ children }: { children: ReactNode }) {
  return <ElectronAppProvider>{children}</ElectronAppProvider>
}

export function ElectronNotesNew() {
  return (
    <ElectronApp>
      <ElectronNewNotePage />
    </ElectronApp>
  )
}

export function ElectronNotesExisting({ noteId }: { noteId: string }) {
  return (
    <ElectronApp>
      <ElectronExistingNotePage noteId={noteId} />
    </ElectronApp>
  )
}

export function ElectronTasksNew() {
  return (
    <ElectronApp>
      <ElectronNewTaskPage />
    </ElectronApp>
  )
}

export function ElectronTasksExisting({ taskId }: { taskId: string }) {
  return (
    <ElectronApp>
      <ElectronExistingTaskPage taskId={taskId} />
    </ElectronApp>
  )
}
