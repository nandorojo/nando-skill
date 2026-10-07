import type { Api } from '@example/api'
import type { RpcClient } from '@example/libraries/effect/rpc'

export type Rpc = RpcClient.FromGroup<Api>
