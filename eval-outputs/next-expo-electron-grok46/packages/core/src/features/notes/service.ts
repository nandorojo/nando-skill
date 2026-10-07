import { Effect } from '@example/libraries/effect'
import type { CreateNote, NoteId, UpdateNote } from './api/schema'
import { CurrentActor } from '../auth/actor'
import { NotesDbTag } from './db'
import { requireNoteRead, requireNoteWrite } from './policy'

export class NotesService {
  static list() {
    return Effect.gen(function* () {
      const actor = yield* CurrentActor
      const scope = yield* requireNoteRead(actor)
      const db = yield* NotesDbTag
      return yield* db.list({ scope })
    })
  }

  static getById({ id }: typeof NoteId.Type) {
    return Effect.gen(function* () {
      const actor = yield* CurrentActor
      const scope = yield* requireNoteRead(actor)
      const db = yield* NotesDbTag
      const record = yield* db.findById({ id, scope })
      if (record === null) {
        return yield* Effect.fail({ _tag: 'notes.unavailable' as const })
      }
      return {
        id: record.id,
        title: record.title,
        body: record.body,
        status: record.status,
        workspaceId: record.workspaceId,
      }
    })
  }

  static create(input: typeof CreateNote.Type) {
    return Effect.gen(function* () {
      const actor = yield* CurrentActor
      const scope = yield* requireNoteWrite(actor)
      if (input.title.trim().length === 0) {
        return yield* Effect.fail({
          _tag: 'notes.rejected' as const,
          message: 'Title is required',
        })
      }
      const db = yield* NotesDbTag
      return yield* db.insert({ record: input, scope })
    })
  }

  static update(input: typeof UpdateNote.Type) {
    return Effect.gen(function* () {
      const actor = yield* CurrentActor
      const scope = yield* requireNoteWrite(actor)
      const db = yield* NotesDbTag
      const record = yield* db.update({ record: input, scope })
      if (record === null) {
        return yield* Effect.fail({
          _tag: 'notes.rejected' as const,
          message: 'Note is not writable in this workspace',
        })
      }
      return record
    })
  }
}
