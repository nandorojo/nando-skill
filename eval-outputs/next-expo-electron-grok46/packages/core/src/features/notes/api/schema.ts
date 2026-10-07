import { Schema } from '@example/libraries/effect'

export const NoteStatus = Schema.Literal('draft', 'published', 'archived')
export type NoteStatus = typeof NoteStatus.Type

export const Note = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  body: Schema.String,
  status: NoteStatus,
  workspaceId: Schema.String,
})
export type Note = typeof Note.Type

export const NoteId = Schema.Struct({ id: Schema.String })
export type NoteId = typeof NoteId.Type

export const CreateNote = Schema.Struct({
  title: Schema.String,
  body: Schema.String,
})
export type CreateNote = typeof CreateNote.Type

export const UpdateNote = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  body: Schema.String,
  status: NoteStatus,
})
export type UpdateNote = typeof UpdateNote.Type

export const NoteList = Schema.Array(Note)
export type NoteList = typeof NoteList.Type

export const NoteUnavailable = Schema.Struct({
  _tag: Schema.Literal('notes.unavailable'),
})
export type NoteUnavailable = typeof NoteUnavailable.Type

export const NoteWrongTeam = Schema.Struct({
  _tag: Schema.Literal('notes.wrong-team'),
  data: Schema.Struct({ requiredTeamId: Schema.String }),
})
export type NoteWrongTeam = typeof NoteWrongTeam.Type

export const NoteRejected = Schema.Struct({
  _tag: Schema.Literal('notes.rejected'),
  message: Schema.String,
})
export type NoteRejected = typeof NoteRejected.Type

export const NoteReadError = Schema.Union(NoteUnavailable, NoteWrongTeam)
export type NoteReadError = typeof NoteReadError.Type

export const NoteWriteError = Schema.Union(NoteRejected, NoteWrongTeam)
export type NoteWriteError = typeof NoteWriteError.Type
