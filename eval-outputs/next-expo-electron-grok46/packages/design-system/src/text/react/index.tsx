import type { TextProps } from './contract'

export function Text({ children, className }: TextProps) {
  return <p className={className}>{children}</p>
}

export function Heading({ children, className }: TextProps) {
  return <h1 className={className}>{children}</h1>
}
