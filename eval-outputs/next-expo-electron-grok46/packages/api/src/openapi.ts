import { ApiRpc } from './rpc'

export function projectOpenApi() {
  void ApiRpc
  return {
    openapi: '3.1.0',
    info: { title: 'Grok 4.6 eval API', version: '0.0.0-mock' },
    paths: {},
  }
}
