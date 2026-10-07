export {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
export type { QueryClient as QueryClientType } from '@tanstack/react-query'
export { environmentManager, makeQueryClient } from './client'
export type { QueryResource, SuspenseQueryResource } from './resource'
