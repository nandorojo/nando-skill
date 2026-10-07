import type { BadgeProps } from './contract'

export function Badge({ children, tone, className }: BadgeProps) {
  return (
    <span data-tone={tone} className={className}>
      {children}
    </span>
  )
}
