import { Button } from '#design-system/button/react/index'
import { Stack } from '#design-system/stack/react/index'
import { Text } from '#design-system/text/react/index'
import type { EmptyStateProps, ErrorNoticeProps, ErrorStateProps, PendingStateProps } from './contract'

export function PendingState({ children, className }: PendingStateProps) {
  return (
    <Stack className={className}>
      <Text>{children}</Text>
    </Stack>
  )
}

export function EmptyState({ children, className }: EmptyStateProps) {
  return (
    <Stack className={className}>
      <Text>{children}</Text>
    </Stack>
  )
}

export function ErrorState({ children, className, onRetry }: ErrorStateProps) {
  return (
    <Stack className={className}>
      <Text>{children}</Text>
      {onRetry ? (
        <Button onPress={onRetry}>
          <Button.Text>Retry</Button.Text>
        </Button>
      ) : null}
    </Stack>
  )
}

export function ErrorNotice({ children, className, onRetry }: ErrorNoticeProps) {
  return (
    <Stack className={className}>
      <Text>{children}</Text>
      {onRetry ? (
        <Button onPress={onRetry}>
          <Button.Text>Retry</Button.Text>
        </Button>
      ) : null}
    </Stack>
  )
}
