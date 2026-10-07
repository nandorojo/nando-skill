import type { ReactNode } from '@example/libraries/react'

export interface ButtonProps {
  children: ReactNode
  onPress(): void
  disabled?: boolean
  className?: string
  accessibilityLabel?: string
}
