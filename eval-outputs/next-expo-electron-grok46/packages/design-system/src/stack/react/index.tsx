import type { StackProps } from './contract'

export function Stack({ children, className }: StackProps) {
  return <div className={className}>{children}</div>
}
