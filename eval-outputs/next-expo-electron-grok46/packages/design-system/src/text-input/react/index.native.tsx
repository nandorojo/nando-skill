import { TextInput as NativeTextInput } from 'react-native'
import type { TextInputProps } from './contract'

export function TextInput({
  value,
  onChangeText,
  disabled,
  accessibilityLabel,
  className,
}: TextInputProps) {
  return (
    <NativeTextInput
      value={value}
      onChangeText={onChangeText}
      editable={!disabled}
      accessibilityLabel={accessibilityLabel}
      className={className}
    />
  )
}
