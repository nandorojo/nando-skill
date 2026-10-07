import type { CreateNote, Note, NoteId, NoteList, UpdateNote } from '@example/core/notes/schema'
import type { CreateTask, Task, TaskId, TaskList, UpdateTask } from '@example/core/tasks/schema'

export type ClientOptions = {
  baseUrl: string
}

export class MockTransportError extends Error {
  readonly _tag = 'client.transport-failed'
  constructor(readonly operation: string) {
    super(`Mock transport refused ${operation}. This eval does not execute RPC.`)
  }
}

function refused<T>(operation: string): Promise<T> {
  return Promise.reject(new MockTransportError(operation))
}

export type Client = {
  notes: {
    list(): Promise<NoteList>
    byId(input: NoteId): Promise<Note>
    create(input: CreateNote): Promise<Note>
    update(input: UpdateNote): Promise<Note>
  }
  tasks: {
    list(): Promise<TaskList>
    byId(input: TaskId): Promise<Task>
    create(input: CreateTask): Promise<Task>
    update(input: UpdateTask): Promise<Task>
  }
  [Symbol.asyncDispose](): Promise<void>
}

export function createClient(_options: ClientOptions): Client {
  return {
    notes: {
      list: () => refused('notes.list'),
      byId: () => refused('notes.byId'),
      create: () => refused('notes.create'),
      update: () => refused('notes.update'),
    },
    tasks: {
      list: () => refused('tasks.list'),
      byId: () => refused('tasks.byId'),
      create: () => refused('tasks.create'),
      update: () => refused('tasks.update'),
    },
    async [Symbol.asyncDispose]() {},
  }
}
