import type { ButtonProps } from './contract'

export function Button({ children, onPress, disabled, className, accessibilityLabel }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={className}
      aria-label={accessibilityLabel}
    >
      {children}
    </button>
  )
}

export function ButtonText({ children }: { children: ButtonProps['children'] }) {
  return <span>{children}</span>
}

Button.Text = ButtonText
