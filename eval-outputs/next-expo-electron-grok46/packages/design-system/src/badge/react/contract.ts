import type { ReactNode } from '@example/libraries/react'
import type { Tone } from '../../index'

export interface BadgeProps {
  children: ReactNode
  tone: Tone
  className?: string
}
