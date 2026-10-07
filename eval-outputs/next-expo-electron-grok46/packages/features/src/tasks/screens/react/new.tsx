'use client'

import { Stack } from '@example/design-system/react'
import * as Composer from '#features/tasks/composer/index'
import { TaskList } from '#features/tasks/react/list'
import { NewTaskComposerProvider } from '#features/tasks/composer/providers/new'

export function NewTaskScreen({ onCreated }: { onCreated(id: string): void }) {
  return (
    <NewTaskComposerProvider onCreated={onCreated}>
      <Stack className="flex-row gap-4">
        <TaskList />
        <Composer.Frame>
          <Composer.Fields />
          <Composer.Footer>
            <Composer.Error />
            <Composer.Submit />
          </Composer.Footer>
        </Composer.Frame>
      </Stack>
    </NewTaskComposerProvider>
  )
}
