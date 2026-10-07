import { useQueryApi } from '@example/client-sdk/react'
import type { Query, ResourceOf } from '@example/client-sdk/react'
import { useQuery } from '@example/libraries/query/react'

type TasksList = Query['tasks']['list']

export function useTasksList(): ResourceOf<TasksList> {
  const query = useQueryApi()
  return useQuery(query.tasks.list.getOptions(undefined))
}
