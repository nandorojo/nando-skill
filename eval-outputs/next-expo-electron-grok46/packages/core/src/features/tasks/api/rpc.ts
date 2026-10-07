import { Rpc, RpcGroup } from '@example/libraries/effect/rpc'
import {
  CreateTask,
  Task,
  TaskId,
  TaskList,
  TaskReadError,
  TaskWriteError,
  UpdateTask,
} from '#core/features/tasks/api/schema'

export const TasksRpc = RpcGroup.make(
  Rpc.make('tasks.list', {
    success: TaskList,
    error: TaskReadError,
  }),
  Rpc.make('tasks.byId', {
    payload: TaskId,
    success: Task,
    error: TaskReadError,
  }),
  Rpc.make('tasks.create', {
    payload: CreateTask,
    success: Task,
    error: TaskWriteError,
  }),
  Rpc.make('tasks.update', {
    payload: UpdateTask,
    success: Task,
    error: TaskWriteError,
  }),
)
