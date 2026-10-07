import { Text } from 'react-native'
import type { BadgeProps } from './contract'

export function Badge({ children, tone, className }: BadgeProps) {
  return (
    <Text data-tone={tone} className={className}>
      {children}
    </Text>
  )
}
