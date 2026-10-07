import { TasksRpc } from './rpc'
import { TasksService } from '../service'

export const TasksApi = TasksRpc.toLayer({
  'tasks.list': TasksService.list,
  'tasks.byId': TasksService.getById,
  'tasks.create': TasksService.create,
  'tasks.update': TasksService.update,
})
