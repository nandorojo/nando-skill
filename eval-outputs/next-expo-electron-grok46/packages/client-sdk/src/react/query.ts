import { mutationOptions, queryOptions } from '@example/libraries/query/react'
import type { Client } from '../client'

function operation<Name extends string>(name: Name) {
  return {
    key: [name] as const,
  }
}

function queryOperation<Name extends string, Input, Output>(
  name: Name,
  run: (input: Input) => Promise<Output>,
) {
  return {
    ...operation(name),
    getOptions(input: Input) {
      return queryOptions({
        queryKey: [name, input] as const,
        queryFn: () => run(input),
      })
    },
  }
}

function mutationOperation<Name extends string, Input, Output>(
  name: Name,
  run: (input: Input) => Promise<Output>,
) {
  return {
    ...operation(name),
    getMutationOptions() {
      return mutationOptions({
        mutationKey: [name] as const,
        mutationFn: (input: Input) => run(input),
      })
    },
  }
}

export function createQuery(client: Client) {
  return {
    notes: {
      list: queryOperation('notes.list', () => client.notes.list()),
      byId: queryOperation('notes.byId', client.notes.byId),
      create: mutationOperation('notes.create', client.notes.create),
      update: mutationOperation('notes.update', client.notes.update),
    },
    tasks: {
      list: queryOperation('tasks.list', () => client.tasks.list()),
      byId: queryOperation('tasks.byId', client.tasks.byId),
      create: mutationOperation('tasks.create', client.tasks.create),
      update: mutationOperation('tasks.update', client.tasks.update),
    },
  }
}

export type Query = ReturnType<typeof createQuery>

export const query = {
  notes: {
    list: operation('notes.list'),
    byId: operation('notes.byId'),
    create: operation('notes.create'),
    update: operation('notes.update'),
  },
  tasks: {
    list: operation('tasks.list'),
    byId: operation('tasks.byId'),
    create: operation('tasks.create'),
    update: operation('tasks.update'),
  },
}
