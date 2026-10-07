'use client'

import { createContext, use, type ReactNode } from '@example/libraries/react'
import type { InputOf } from '@example/client-sdk'
import type { Query } from '@example/client-sdk/react'

export type NoteId = InputOf<Query['notes']['byId']>['id']
type NoteIdValue = NoteId | Promise<NoteId>

const NoteIdContext = createContext<NoteIdValue | null>(null)

export function NoteIdProvider({ value, children }: {
  value: NoteIdValue
  children: ReactNode
}) {
  return <NoteIdContext value={value}>{children}</NoteIdContext>
}

export function useNoteId(): NoteId {
  const value = use(NoteIdContext)
  if (value === null) throw new Error('NoteIdProvider is required')
  return typeof value === 'string' ? value : use(value)
}

type SelectionContract = {
  state: { selectedId: NoteId | null }
  actions: {
    select(id: NoteId): void
  }
}

const SelectionContext = createContext<SelectionContract | null>(null)

export function NoteSelectionProvider({ value, children }: {
  value: SelectionContract
  children: ReactNode
}) {
  return <SelectionContext value={value}>{children}</SelectionContext>
}

export function useNoteSelection(): SelectionContract {
  const value = use(SelectionContext)
  if (value === null) throw new Error('NoteSelectionProvider is required')
  return value
}
