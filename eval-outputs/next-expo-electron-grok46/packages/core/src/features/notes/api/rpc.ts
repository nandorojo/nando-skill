import { Rpc, RpcGroup } from '@example/libraries/effect/rpc'
import {
  CreateNote,
  Note,
  NoteId,
  NoteList,
  NoteReadError,
  NoteWriteError,
  UpdateNote,
} from './schema'

export const NotesRpc = RpcGroup.make(
  Rpc.make('notes.list', {
    success: NoteList,
    error: NoteReadError,
  }),
  Rpc.make('notes.byId', {
    payload: NoteId,
    success: Note,
    error: NoteReadError,
  }),
  Rpc.make('notes.create', {
    payload: CreateNote,
    success: Note,
    error: NoteWriteError,
  }),
  Rpc.make('notes.update', {
    payload: UpdateNote,
    success: Note,
    error: NoteWriteError,
  }),
)
