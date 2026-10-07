import { useQueryApi } from '@example/client-sdk/react'
import { useMutation } from '@example/libraries/query/react'

export function useUpdateTask() {
  const query = useQueryApi()
  return useMutation(query.tasks.update.getMutationOptions())
}
