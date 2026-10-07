import type { QueryResource, SuspenseQueryResource } from '@example/libraries/query/react'
import type { OutputOf } from '../inference'

export type ResourceOf<T> = T extends { getOptions: (...args: never[]) => infer Options }
  ? Options extends { queryFn: () => Promise<infer Data> }
    ? QueryResource<Data>
    : never
  : QueryResource<OutputOf<T>>

export type SuspenseResourceOf<T> = T extends { getOptions: (...args: never[]) => infer Options }
  ? Options extends { queryFn: () => Promise<infer Data> }
    ? SuspenseQueryResource<Data>
    : never
  : SuspenseQueryResource<OutputOf<T>>
