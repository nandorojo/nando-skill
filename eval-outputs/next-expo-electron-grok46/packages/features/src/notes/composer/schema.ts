import { Schema } from '@example/libraries/effect'

export const DraftTitle = Schema.String
export type DraftTitle = typeof DraftTitle.Type

export const DraftBody = Schema.String
export type DraftBody = typeof DraftBody.Type

export const ComposerDraft = Schema.Struct({
  title: DraftTitle,
  body: DraftBody,
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
export type ComposerSubmission = typeof ComposerSubmission.Type

export const ComposerMetaData = Schema.Struct({
  submission: ComposerSubmission,
  canSubmit: Schema.Boolean,
})
export type ComposerMetaData = typeof ComposerMetaData.Type
