import { Pressable, Text } from 'react-native'
import type { ButtonProps } from './contract'

export function Button({ children, onPress, disabled, className, accessibilityLabel }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={className}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Pressable>
  )
}

export function ButtonText({ children }: { children: ButtonProps['children'] }) {
  return <Text>{children}</Text>
}

Button.Text = ButtonText
