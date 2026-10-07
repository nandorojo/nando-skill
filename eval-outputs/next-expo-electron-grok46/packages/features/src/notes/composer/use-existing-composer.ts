import { useRef, useState } from '@example/libraries/react'
import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import type { TextInputHandle } from '@example/design-system/react'
import { useNoteById } from '#features/notes/react/use-note-by-id'
import { useUpdateNote } from '#features/notes/react/use-update-note'
import type { ComposerContract } from '#features/notes/composer/contract'
import type { ComposerDraft, SubmitResult } from '#features/notes/composer/schema'

type NoteId = InputOf<Query['notes']['byId']>['id']

export function useExistingComposer({ noteId }: { noteId: NoteId }): ComposerContract {
  const note = useNoteById({ id: noteId })
  const update = useUpdateNote()
  const inputRef = useRef<TextInputHandle | null>(null)
  const [draft, setDraft] = useState<ComposerDraft | null>(null)
  const [submission, setSubmission] = useState<ComposerContract['meta']['submission']>({ kind: 'idle' })
  const baseline: ComposerDraft = {
    title: note.data?.title ?? '',
    body: note.data?.body ?? '',
  }
  const state = draft ?? baseline

  return {
    state,
    meta: {
      submission: note.data === undefined
        ? { kind: 'idle' }
        : submission,
      canSubmit: note.data !== undefined && submission.kind !== 'submitting' && state.title.trim().length > 0,
      inputRef,
    },
    actions: {
      patch(next) {
        if (submission.kind === 'submitting') return
        setDraft(current => ({ ...(current ?? baseline), ...next }))
      },
      replace(next) {
        if (submission.kind === 'submitting') return
        setDraft(next)
      },
      reset() {
        if (submission.kind === 'submitting') return
        setDraft(null)
        setSubmission({ kind: 'idle' })
      },
      async submit(): Promise<SubmitResult> {
        if (!note.data) return { kind: 'rejected', message: 'Note is not loaded' }
        setSubmission({ kind: 'submitting' })
        try {
          const saved = await update.mutateAsync({
            id: note.data.id,
            title: state.title,
            body: state.body,
            status: note.data.status,
          })
          setDraft(null)
          setSubmission({ kind: 'idle' })
          return { kind: 'sent', id: saved.id }
        } catch {
          setSubmission({ kind: 'failed', message: 'Update is mocked in this eval' })
          return { kind: 'rejected', message: 'Update is mocked in this eval' }
        }
      },
    },
  }
}
