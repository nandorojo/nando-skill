export type TextInputHandle = {
  focus(): void
}

export interface TextInputProps {
  value: string
  onChangeText(text: string): void
  disabled?: boolean
  accessibilityLabel?: string
  className?: string
  ref?: { current: TextInputHandle | null }
}
