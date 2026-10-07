'use client'

import { Stack, TextInput } from '@example/design-system/react'
import { useComposer } from '#features/notes/composer/context'

export function ComposerTitleInput() {
  const { state, actions, meta } = useComposer()
  return (
    <TextInput
      ref={meta.inputRef}
      value={state.title}
      onChangeText={title => actions.patch({ title })}
      disabled={meta.submission.kind === 'submitting'}
      accessibilityLabel="Note title"
    />
  )
}

export function ComposerBodyInput() {
  const { state, actions, meta } = useComposer()
  return (
    <TextInput
      value={state.body}
      onChangeText={body => actions.patch({ body })}
      disabled={meta.submission.kind === 'submitting'}
      accessibilityLabel="Note body"
    />
  )
}

export function ComposerFields() {
  return (
    <Stack className="gap-2">
      <ComposerTitleInput />
      <ComposerBodyInput />
    </Stack>
  )
}
