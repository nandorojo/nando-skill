import { RpcClient } from '@example/libraries/effect/rpc'
import { ApiRpc } from '@example/api/rpc'

export const acquire = RpcClient.make(ApiRpc)
