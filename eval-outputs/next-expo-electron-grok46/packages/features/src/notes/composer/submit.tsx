'use client'

import { Button, ErrorNotice } from '@example/design-system/react'
import { useComposer } from '#features/notes/composer/context'

export function ComposerSubmit() {
  const { actions, meta } = useComposer()
  return (
    <Button
      disabled={!meta.canSubmit}
      onPress={() => { void actions.submit() }}
    >
      <Button.Text>Save note</Button.Text>
    </Button>
  )
}

export function ComposerError() {
  const { meta } = useComposer()
  if (meta.submission.kind !== 'failed') return null
  return <ErrorNotice>{meta.submission.message}</ErrorNotice>
}
