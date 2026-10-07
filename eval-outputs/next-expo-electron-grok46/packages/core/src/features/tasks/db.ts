import { Context, Effect } from '@example/libraries/effect'
import type { CreateTask, Task, UpdateTask } from './api/schema'

export type TasksScope = {
  workspaceId: string
}

export type TasksDb = {
  list(input: { scope: TasksScope }): Effect.Effect<readonly Task[]>
  findById(input: { id: string; scope: TasksScope }): Effect.Effect<Task | null>
  insert(input: { record: CreateTask; scope: TasksScope }): Effect.Effect<Task>
  update(input: { record: UpdateTask; scope: TasksScope }): Effect.Effect<Task | null>
}

export class TasksDbTag extends Context.Tag('TasksDb')<TasksDbTag, TasksDb>() {}

const seed: Task[] = [
  {
    id: 'task_mock_1',
    title: 'Mock task',
    description: 'Seed row for the eval. Not production data.',
    status: 'open',
    workspaceId: 'ws_mock',
  },
]

export const TasksDbMock: TasksDb = {
  list({ scope }) {
    return Effect.succeed(seed.filter(task => task.workspaceId === scope.workspaceId))
  },
  findById({ id, scope }) {
    return Effect.succeed(
      seed.find(task => task.id === id && task.workspaceId === scope.workspaceId) ?? null,
    )
  },
  insert({ record, scope }) {
    return Effect.succeed({
      id: 'task_mock_created',
      title: record.title,
      description: record.description,
      status: 'open',
      workspaceId: scope.workspaceId,
    })
  },
  update({ record, scope }) {
    const existing = seed.find(task => task.id === record.id && task.workspaceId === scope.workspaceId)
    if (!existing) return Effect.succeed(null)
    return Effect.succeed({ ...existing, ...record, workspaceId: scope.workspaceId })
  },
}
