// Third-party schema ownership lives at this library boundary.
// This intentionally owns the selected dependency; it does not pretend that
// exchanging a schema engine is a zero-cost change.
import { z } from 'zod'

export { z as schema }
export type Output<T extends z.ZodType> = z.output<T>
