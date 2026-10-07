import type { TextInputHandle, TextInputProps } from './contract'

export function TextInput({
  value,
  onChangeText,
  disabled,
  accessibilityLabel,
  className,
  ref,
}: TextInputProps) {
  return (
    <input
      ref={node => {
        if (!ref) return
        ref.current = node
          ? { focus() { node.focus() } } satisfies TextInputHandle
          : null
      }}
      value={value}
      onChange={event => onChangeText(event.currentTarget.value)}
      disabled={disabled}
      aria-label={accessibilityLabel}
      className={className}
    />
  )
}
