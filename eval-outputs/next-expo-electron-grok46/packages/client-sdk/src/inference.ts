export type InputOf<T> = T extends { getOptions: (input: infer I) => unknown }
  ? I
  : T extends (input: infer I, ...rest: never[]) => unknown
    ? I
    : never

export type OutputOf<T> = T extends (...args: never[]) => Promise<infer O>
  ? O
  : T extends { getOptions: (input: never) => { queryFn: () => Promise<infer O> } }
    ? O
    : never
