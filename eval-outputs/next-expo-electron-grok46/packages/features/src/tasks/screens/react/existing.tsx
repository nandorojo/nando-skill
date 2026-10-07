'use client'

import { Stack } from '@example/design-system/react'
import * as Composer from '#features/tasks/composer/index'
import { TaskDetails } from '#features/tasks/react/details'
import { TaskList } from '#features/tasks/react/list'
import { ExistingTaskComposerProvider } from '#features/tasks/composer/providers/existing'
import { useTaskId } from '#features/tasks/selection/context'

export function ExistingTaskScreen() {
  const taskId = useTaskId()
  return (
    <ExistingTaskComposerProvider taskId={taskId}>
      <Stack className="flex-row gap-4">
        <TaskList />
        <Stack className="gap-3">
          <TaskDetails id={taskId} />
          <Composer.Frame>
            <Composer.Fields />
            <Composer.Footer>
              <Composer.Error />
              <Composer.Submit />
            </Composer.Footer>
          </Composer.Frame>
        </Stack>
      </Stack>
    </ExistingTaskComposerProvider>
  )
}
