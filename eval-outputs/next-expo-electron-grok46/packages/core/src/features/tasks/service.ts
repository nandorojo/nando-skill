import { Effect } from '@example/libraries/effect'
import type { CreateTask, TaskId, UpdateTask } from './api/schema'
import { CurrentActor } from '../auth/actor'
import { TasksDbTag } from './db'
import { requireTaskRead, requireTaskWrite } from './policy'

export class TasksService {
  static list() {
    return Effect.gen(function* () {
      const actor = yield* CurrentActor
      const scope = yield* requireTaskRead(actor)
      const db = yield* TasksDbTag
      return yield* db.list({ scope })
    })
  }

  static getById({ id }: typeof TaskId.Type) {
    return Effect.gen(function* () {
      const actor = yield* CurrentActor
      const scope = yield* requireTaskRead(actor)
      const db = yield* TasksDbTag
      const record = yield* db.findById({ id, scope })
      if (record === null) {
        return yield* Effect.fail({ _tag: 'tasks.unavailable' as const })
      }
      return {
        id: record.id,
        title: record.title,
        description: record.description,
        status: record.status,
        workspaceId: record.workspaceId,
      }
    })
  }

  static create(input: typeof CreateTask.Type) {
    return Effect.gen(function* () {
      const actor = yield* CurrentActor
      const scope = yield* requireTaskWrite(actor)
      if (input.title.trim().length === 0) {
        return yield* Effect.fail({
          _tag: 'tasks.rejected' as const,
          message: 'Title is required',
        })
      }
      const db = yield* TasksDbTag
      return yield* db.insert({ record: input, scope })
    })
  }

  static update(input: typeof UpdateTask.Type) {
    return Effect.gen(function* () {
      const actor = yield* CurrentActor
      const scope = yield* requireTaskWrite(actor)
      const db = yield* TasksDbTag
      const record = yield* db.update({ record: input, scope })
      if (record === null) {
        return yield* Effect.fail({
          _tag: 'tasks.rejected' as const,
          message: 'Task is not writable in this workspace',
        })
      }
      return record
    })
  }
}
