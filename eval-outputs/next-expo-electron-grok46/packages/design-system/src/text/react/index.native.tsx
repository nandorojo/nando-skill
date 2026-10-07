import { Text as NativeText } from 'react-native'
import type { TextProps } from './contract'

export function Text({ children, className }: TextProps) {
  return <NativeText className={className}>{children}</NativeText>
}

export function Heading({ children, className }: TextProps) {
  return <NativeText className={className}>{children}</NativeText>
}
