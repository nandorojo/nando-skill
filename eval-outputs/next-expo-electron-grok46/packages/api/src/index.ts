import { ApiRpc } from './rpc'
import { ApiLive } from './live'

export type Api = typeof ApiRpc

export async function handler(_request: Request): Promise<Response> {
  void ApiLive
  return new Response('Mock API host: RPC is not executed in this eval.', {
    status: 501,
    headers: { 'content-type': 'text/plain' },
  })
}

export async function dispose(): Promise<void> {}
