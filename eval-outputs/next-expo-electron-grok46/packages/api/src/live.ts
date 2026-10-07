import { Layer } from '@example/libraries/effect'
import { NotesApi } from '@example/core/notes/server'
import { TasksApi } from '@example/core/tasks/server'

export const ApiLive = Layer.mergeAll(NotesApi, TasksApi)
