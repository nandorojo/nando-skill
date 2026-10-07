import { useQueryApi } from '@example/client-sdk/react'
import { useMutation } from '@example/libraries/query/react'

export function useCreateTask() {
  const query = useQueryApi()
  return useMutation(query.tasks.create.getMutationOptions())
}
