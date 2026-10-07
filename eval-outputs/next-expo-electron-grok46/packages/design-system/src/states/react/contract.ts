import type { ReactNode } from '@example/libraries/react'

export interface PendingStateProps {
  children: ReactNode
  className?: string
}

export interface EmptyStateProps {
  children: ReactNode
  className?: string
}

export interface ErrorStateProps {
  children: ReactNode
  className?: string
  onRetry?(): void
}

export interface ErrorNoticeProps {
  children: ReactNode
  className?: string
  onRetry?(): void
}
