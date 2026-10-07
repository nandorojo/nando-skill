import { useRef, useState } from '@example/libraries/react'
import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'
import type { TextInputHandle } from '@example/design-system/react'
import { useTaskById } from '#features/tasks/react/use-task-by-id'
import { useUpdateTask } from '#features/tasks/react/use-update-task'
import type { ComposerContract } from '#features/tasks/composer/contract'
import type { ComposerDraft, SubmitResult } from '#features/tasks/composer/schema'

type TaskId = InputOf<Query['tasks']['byId']>['id']

export function useExistingComposer({ taskId }: { taskId: TaskId }): ComposerContract {
  const task = useTaskById({ id: taskId })
  const update = useUpdateTask()
  const inputRef = useRef<TextInputHandle | null>(null)
  const [draft, setDraft] = useState<ComposerDraft | null>(null)
  const [submission, setSubmission] = useState<ComposerContract['meta']['submission']>({ kind: 'idle' })
  const baseline: ComposerDraft = {
    title: task.data?.title ?? '',
    description: task.data?.description ?? '',
    status: task.data?.status ?? 'open',
  }
  const state = draft ?? baseline

  return {
    state,
    meta: {
      submission: task.data === undefined ? { kind: 'idle' } : submission,
      canSubmit: task.data !== undefined && submission.kind !== 'submitting' && state.title.trim().length > 0,
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
        if (!task.data) return { kind: 'rejected', message: 'Task is not loaded' }
        setSubmission({ kind: 'submitting' })
        try {
          const saved = await update.mutateAsync({
            id: task.data.id,
            title: state.title,
            description: state.description,
            status: state.status,
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
