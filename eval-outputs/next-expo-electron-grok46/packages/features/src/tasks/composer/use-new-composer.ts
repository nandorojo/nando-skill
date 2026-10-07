import { useRef, useState } from '@example/libraries/react'
import type { TextInputHandle } from '@example/design-system/react'
import { useCreateTask } from '#features/tasks/react/use-create-task'
import type { ComposerContract } from '#features/tasks/composer/contract'
import type { ComposerDraft, ComposerMetaData, SubmitResult } from '#features/tasks/composer/schema'

const emptyDraft: ComposerDraft = { title: '', description: '', status: 'open' }

function metaFor(draft: ComposerDraft, submission: ComposerMetaData['submission']): ComposerMetaData {
  return {
    submission,
    canSubmit: submission.kind !== 'submitting' && draft.title.trim().length > 0,
  }
}

export function useNewComposer(options: { onCreated(id: string): void }): ComposerContract {
  const create = useCreateTask()
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
          const task = await create.mutateAsync({ title: draft.title, description: draft.description })
          options.onCreated(task.id)
          setDraft(emptyDraft)
          setSubmission({ kind: 'idle' })
          return { kind: 'sent', id: task.id }
        } catch {
          setSubmission({ kind: 'failed', message: 'Create is mocked in this eval' })
          return { kind: 'rejected', message: 'Create is mocked in this eval' }
        }
      },
    },
  }
}
