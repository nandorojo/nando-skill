# Configuration has one owner

Prefer one typed configuration entry point per application/runtime boundary. Read expected environment variables explicitly, validate them together with the existing owned schema library, and export the parsed result. Infer types from that schema. Consumers use the result instead of reading `process.env`, parsing again, or repeating fallbacks.

Keep server secrets and browser-safe configuration in separate entry points. Validate when the owning runtime initializes, respecting framework build/runtime boundaries. An independently running service or external-service adapter may own its environment contract; this does not justify scattered reads across consumers.

## Apps supply deployment choices; public factories resolve defaults

- Apps own deployed origins, mount paths, and host-specific choices. Supply them through typed SDK/API options; portable packages do not import app config or implicitly read the app's environment.
- Define reusable defaults once at the owning package's public construction/export boundary. The barrel can re-export their implementation; it need not execute configuration logic. Resolve options there, then pass resolved values internally instead of repeating fallbacks in transports, hooks, and helpers.
- Prefer env-backed values with sensible fallbacks for deployment settings. App env schemas reuse exported package defaults rather than copying literals. Server mounts and client URLs should derive from the same owned path definition where applicable.
- Keep fixed values in named, owner-local constants. Avoid inline origins, URLs, base paths, and similar configuration strings at use sites—even with one caller. Literals generally belong where the default or constant is defined. Derive related URLs rather than maintaining parallel strings.
- Required credentials have no fake fallback. Defaults apply to missing optional values; invalid supplied values fail validation. Distinguish browser-relative paths from server transports requiring absolute URLs.

These are ownership preferences, not a blanket string ban or a requirement to make every constant configurable. Protocol literals, test fixtures, and fixed external-service endpoints can stay with their owning adapter. Do not add a global config registry or env variable without a real consumer need.

## Example consumption

Illustrative server configuration using Zod through an owned entry point:

```ts
// apps/web/src/config/server.ts — server-only
import { z } from '@example/libraries/schema'
import { DEFAULT_API_BASE_PATH } from '@example/client-sdk'

const envSchema = z.object({
  TOKEN: z.string().min(1),
  API_ORIGIN: z.string().url(),
  API_BASE_PATH: z.string().startsWith('/').default(DEFAULT_API_BASE_PATH),
})

export const env = envSchema.parse({
  TOKEN: process.env.TOKEN,
  API_ORIGIN: process.env.API_ORIGIN,
  API_BASE_PATH: process.env.API_BASE_PATH,
})
```

`z.object` defines validators; `.parse` receives env values. Use the existing schema system instead of adding Zod solely for this pattern. Browser configuration exposes only deliberately public settings, with the framework's required env-access semantics.

```ts
// App bootstrap supplies host configuration through the public SDK boundary.
import { createClient } from '@example/client-sdk'
import { env } from '#app/config/server'

const sdkClient = createClient({
  baseUrl: new URL(env.API_BASE_PATH, env.API_ORIGIN).href,
})
```

The package defines and exports `DEFAULT_API_BASE_PATH` once. Its public factory applies that same default when appropriate for its supported runtime; deeper implementations receive resolved options. This specifies ownership, not a required SDK option spelling or a universal server URL default.

## In-process origins

A hardcoded `inProcessOrigin` deserves an ownership check. If it represents an actual destination, the app supplies it through validated config. If it only satisfies a `Request`/URL constructor and an injected transport dispatches entirely in process, keep it as one named constant in that transport adapter and document why it cannot reach the network. Avoid leaking the synthetic origin into product URL construction, duplicating it across layers, or adding a deployment env just to configure an implementation placeholder.

Review a value from its env/default owner through the public factory to its consumers. Confirm that host overrides reach all affected consumers and secrets stay server-side. Verify real configuration behavior rather than imposing a blanket literal ban.
