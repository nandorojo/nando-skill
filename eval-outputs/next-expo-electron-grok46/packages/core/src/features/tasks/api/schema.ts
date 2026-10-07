import { Schema } from '@example/libraries/effect'

export const TaskStatus = Schema.Literal('open', 'in_progress', 'done')
export type TaskStatus = typeof TaskStatus.Type

export const Task = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: TaskStatus,
  workspaceId: Schema.String,
})
export type Task = typeof Task.Type

export const TaskId = Schema.Struct({ id: Schema.String })
export type TaskId = typeof TaskId.Type

export const CreateTask = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
})
export type CreateTask = typeof CreateTask.Type

export const UpdateTask = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: TaskStatus,
})
export type UpdateTask = typeof UpdateTask.Type

export const TaskList = Schema.Array(Task)
export type TaskList = typeof TaskList.Type

export const TaskUnavailable = Schema.Struct({
  _tag: Schema.Literal('tasks.unavailable'),
})
export type TaskUnavailable = typeof TaskUnavailable.Type

export const TaskWrongTeam = Schema.Struct({
  _tag: Schema.Literal('tasks.wrong-team'),
  data: Schema.Struct({ requiredTeamId: Schema.String }),
})
export type TaskWrongTeam = typeof TaskWrongTeam.Type

export const TaskRejected = Schema.Struct({
  _tag: Schema.Literal('tasks.rejected'),
  message: Schema.String,
})
export type TaskRejected = typeof TaskRejected.Type

export const TaskReadError = Schema.Union(TaskUnavailable, TaskWrongTeam)
export type TaskReadError = typeof TaskReadError.Type

export const TaskWriteError = Schema.Union(TaskRejected, TaskWrongTeam)
export type TaskWriteError = typeof TaskWriteError.Type
