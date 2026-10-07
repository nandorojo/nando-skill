import { handler as vanillaHandler, dispose } from '../index'

export function handler(request: Request) {
  return vanillaHandler(request)
}

export { dispose }
