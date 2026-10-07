'use client'

import { Button, Stack, TextInput } from '@example/design-system/react'
import type { TaskStatus } from '@example/core/tasks/schema'
import { useComposer } from '#features/tasks/composer/context'

const statuses: readonly TaskStatus[] = ['open', 'in_progress', 'done']

export function ComposerFields() {
  const { state, actions, meta } = useComposer()
  return (
    <Stack className="gap-2">
      <TextInput
        ref={meta.inputRef}
        value={state.title}
        onChangeText={title => actions.patch({ title })}
        disabled={meta.submission.kind === 'submitting'}
        accessibilityLabel="Task title"
      />
      <TextInput
        value={state.description}
        onChangeText={description => actions.patch({ description })}
        disabled={meta.submission.kind === 'submitting'}
        accessibilityLabel="Task description"
      />
      <Stack className="flex-row gap-2">
        {statuses.map(status => (
          <Button
            key={status}
            disabled={meta.submission.kind === 'submitting'}
            onPress={() => actions.patch({ status })}
          >
            <Button.Text>{status}</Button.Text>
          </Button>
        ))}
      </Stack>
    </Stack>
  )
}
