import { Schema } from '@example/libraries/effect'
import { TaskStatus } from '@example/core/tasks/schema'

export const ComposerDraft = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  status: TaskStatus,
})
export type ComposerDraft = typeof ComposerDraft.Type
export const ComposerDraftPatch = Schema.partial(ComposerDraft)
export type ComposerDraftPatch = typeof ComposerDraftPatch.Type

export const SubmitResult = Schema.Union(
  Schema.Struct({ kind: Schema.Literal('sent'), id: Schema.String }),
  Schema.Struct({ kind: Schema.Literal('rejected'), message: Schema.String }),
)
export type SubmitResult = typeof SubmitResult.Type

export const ComposerSubmission = Schema.Union(
  Schema.Struct({ kind: Schema.Literal('idle') }),
  Schema.Struct({ kind: Schema.Literal('submitting') }),
  Schema.Struct({ kind: Schema.Literal('failed'), message: Schema.String }),
)

export const ComposerMetaData = Schema.Struct({
  submission: ComposerSubmission,
  canSubmit: Schema.Boolean,
})
export type ComposerMetaData = typeof ComposerMetaData.Type
