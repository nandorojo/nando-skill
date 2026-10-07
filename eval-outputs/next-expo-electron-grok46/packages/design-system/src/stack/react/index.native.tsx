import { View } from 'react-native'
import type { StackProps } from './contract'

export function Stack({ children, className }: StackProps) {
  return <View className={className}>{children}</View>
}
