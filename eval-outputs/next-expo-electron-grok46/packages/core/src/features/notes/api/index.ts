import { NotesRpc } from './rpc'
import { NotesService } from '../service'

export const NotesApi = NotesRpc.toLayer({
  'notes.list': NotesService.list,
  'notes.byId': NotesService.getById,
  'notes.create': NotesService.create,
  'notes.update': NotesService.update,
})
