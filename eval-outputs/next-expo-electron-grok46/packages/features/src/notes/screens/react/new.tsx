'use client'

import * as Composer from '#features/notes/composer/index'
import * as Panels from '#features/notes/panels/index'
import { NoteList } from '#features/notes/react/list'
import { NewNoteComposerProvider } from '#features/notes/composer/providers/new'

export function NewNoteScreen({ onCreated }: { onCreated(id: string): void }) {
  return (
    <NewNoteComposerProvider onCreated={onCreated}>
      <Panels.Root>
        <Panels.Panel placement="list">
          <NoteList />
        </Panels.Panel>
        <Panels.Panel placement="editor">
          <Composer.Frame>
            <Composer.Fields />
            <Composer.Footer>
              <Composer.Error />
              <Composer.Submit />
            </Composer.Footer>
          </Composer.Frame>
        </Panels.Panel>
      </Panels.Root>
    </NewNoteComposerProvider>
  )
}
