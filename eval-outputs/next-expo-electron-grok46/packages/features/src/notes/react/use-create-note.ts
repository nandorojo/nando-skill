import { useQueryApi } from '@example/client-sdk/react'
import { useMutation } from '@example/libraries/query/react'

export function useCreateNote() {
  const query = useQueryApi()
  return useMutation(query.notes.create.getMutationOptions())
}
