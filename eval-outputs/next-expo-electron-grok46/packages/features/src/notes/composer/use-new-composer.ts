import { useRef, useState } from '@example/libraries/react'
import type { TextInputHandle } from '@example/design-system/react'
import { useCreateNote } from '#features/notes/react/use-create-note'
import type { ComposerContract } from '#features/notes/composer/contract'
import type { ComposerDraft, ComposerMetaData, SubmitResult } from '#features/notes/composer/schema'

const emptyDraft: ComposerDraft = { title: '', body: '' }

function metaFor(draft: ComposerDraft, submission: ComposerMetaData['submission']): ComposerMetaData {
  return {
    submission,
    canSubmit: submission.kind !== 'submitting' && draft.title.trim().length > 0,
  }
}

export function useNewComposer(options: {
  onCreated(id: string): void
}): ComposerContract {
  const create = useCreateNote()
  const inputRef = useRef<TextInputHandle | null>(null)
  const [draft, setDraft] = useState<ComposerDraft>(emptyDraft)
  const [submission, setSubmission] = useState<ComposerMetaData['submission']>({ kind: 'idle' })

  return {
    state: draft,
    meta: { ...metaFor(draft, submission), inputRef },
    actions: {
      patch(next) {
        if (submission.kind === 'submitting') return
        setDraft(current => ({ ...current, ...next }))
      },
      replace(next) {
        if (submission.kind === 'submitting') return
        setDraft(next)
      },
      reset() {
        if (submission.kind === 'submitting') return
        setDraft(emptyDraft)
        setSubmission({ kind: 'idle' })
      },
      async submit(): Promise<SubmitResult> {
        if (!metaFor(draft, submission).canSubmit) {
          return { kind: 'rejected', message: 'Title is required' }
        }
        setSubmission({ kind: 'submitting' })
        try {
          const note = await create.mutateAsync(draft)
          options.onCreated(note.id)
          setDraft(emptyDraft)
          setSubmission({ kind: 'idle' })
          return { kind: 'sent', id: note.id }
        } catch {
          setSubmission({ kind: 'failed', message: 'Create is mocked in this eval' })
          return { kind: 'rejected', message: 'Create is mocked in this eval' }
        }
      },
    },
  }
}
