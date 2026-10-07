'use client'

import * as Composer from '#features/notes/composer/index'
import * as Panels from '#features/notes/panels/index'
import { NoteDetails } from '#features/notes/react/details'
import { NoteList } from '#features/notes/react/list'
import { ExistingNoteComposerProvider } from '#features/notes/composer/providers/existing'
import { useNoteId } from '#features/notes/selection/context'

export function ExistingNoteScreen() {
  const noteId = useNoteId()
  return (
    <ExistingNoteComposerProvider noteId={noteId}>
      <Panels.Root>
        <Panels.Panel placement="list">
          <NoteList />
        </Panels.Panel>
        <Panels.Panel placement="editor">
          <NoteDetails id={noteId} />
          <Composer.Frame>
            <Composer.Fields />
            <Composer.Footer>
              <Composer.Error />
              <Composer.Submit />
            </Composer.Footer>
          </Composer.Frame>
        </Panels.Panel>
      </Panels.Root>
    </ExistingNoteComposerProvider>
  )
}
