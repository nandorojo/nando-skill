import type { InputOf } from '@example/client-sdk'
import { useQueryApi } from '@example/client-sdk/react'
import type { Query, ResourceOf } from '@example/client-sdk/react'
import { useQuery } from '@example/libraries/query/react'

type TaskRead = Query['tasks']['byId']

export function useTaskById(input: InputOf<TaskRead>): ResourceOf<TaskRead> {
  const query = useQueryApi()
  return useQuery(query.tasks.byId.getOptions(input))
}
