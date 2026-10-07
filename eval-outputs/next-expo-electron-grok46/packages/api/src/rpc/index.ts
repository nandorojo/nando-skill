import { RpcGroup } from '@example/libraries/effect/rpc'
import { NotesRpc } from '@example/core/notes/rpc'
import { TasksRpc } from '@example/core/tasks/rpc'

export const ApiRpc = RpcGroup.make().merge(NotesRpc, TasksRpc)
