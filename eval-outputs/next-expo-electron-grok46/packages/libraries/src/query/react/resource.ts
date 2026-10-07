import type {
  DefaultError,
  UseQueryResult,
  UseSuspenseQueryResult,
} from '@tanstack/react-query'

type ResourceFields<T> = T extends unknown
  ? Pick<T, Extract<keyof T, 'data' | 'error' | 'status' | 'fetchStatus'>>
  : never

export type QueryResource<TData, TError = DefaultError> =
  ResourceFields<UseQueryResult<TData, TError>>

export type SuspenseQueryResource<TData, TError = DefaultError> =
  ResourceFields<UseSuspenseQueryResult<TData, TError>>
