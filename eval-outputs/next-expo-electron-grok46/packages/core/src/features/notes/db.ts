import { Context, Effect } from '@example/libraries/effect'
import type { CreateNote, Note, UpdateNote } from './api/schema'

export type NotesScope = {
  workspaceId: string
}

export type NotesDb = {
  list(input: { scope: NotesScope }): Effect.Effect<readonly Note[]>
  findById(input: { id: string; scope: NotesScope }): Effect.Effect<Note | null>
  insert(input: { record: CreateNote; scope: NotesScope }): Effect.Effect<Note>
  update(input: { record: UpdateNote; scope: NotesScope }): Effect.Effect<Note | null>
}

export class NotesDbTag extends Context.Tag('NotesDb')<NotesDbTag, NotesDb>() {}

const seed: Note[] = [
  {
    id: 'note_mock_1',
    title: 'Mock note',
    body: 'Seed row for the eval. Not production data.',
    status: 'draft',
    workspaceId: 'ws_mock',
  },
]

export const NotesDbMock: NotesDb = {
  list({ scope }) {
    return Effect.succeed(seed.filter(note => note.workspaceId === scope.workspaceId))
  },
  findById({ id, scope }) {
    return Effect.succeed(
      seed.find(note => note.id === id && note.workspaceId === scope.workspaceId) ?? null,
    )
  },
  insert({ record, scope }) {
    return Effect.succeed({
      id: 'note_mock_created',
      title: record.title,
      body: record.body,
      status: 'draft',
      workspaceId: scope.workspaceId,
    })
  },
  update({ record, scope }) {
    const existing = seed.find(note => note.id === record.id && note.workspaceId === scope.workspaceId)
    if (!existing) return Effect.succeed(null)
    return Effect.succeed({ ...existing, ...record, workspaceId: scope.workspaceId })
  },
}
