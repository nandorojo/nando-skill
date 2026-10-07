'use client'

import { createContext, use, type ReactNode } from '@example/libraries/react'
import type { ComposerContract } from './contract'

const Context = createContext<ComposerContract | null>(null)

export function useComposer(): ComposerContract {
  const value = use(Context)
  if (value === null) throw new Error('Composer.Provider is required')
  return value
}

export function ComposerProvider({ value, children }: {
  value: ComposerContract
  children: ReactNode
}) {
  return <Context value={value}>{children}</Context>
}
