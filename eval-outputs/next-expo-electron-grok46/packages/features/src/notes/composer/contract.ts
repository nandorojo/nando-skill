import type { TextInputHandle } from '@example/design-system/react'
import type { RefObject } from '@example/libraries/react'
import type { ComposerDraft, ComposerDraftPatch, ComposerMetaData, SubmitResult } from './schema'

export interface ComposerContract {
  state: ComposerDraft
  meta: ComposerMetaData & { inputRef: RefObject<TextInputHandle | null> }
  actions: {
    patch(patch: ComposerDraftPatch): void
    replace(draft: ComposerDraft): void
    reset(): void
    submit(): Promise<SubmitResult>
  }
}
