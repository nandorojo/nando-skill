import { strict as assert } from 'node:assert'
import { GetUserInput } from './core/features/users/schema'
import { UsersState, type QuerySnapshot } from './client/features/users/schema'
import { getById, type UsersDatabase } from './core/features/users/service'
import { getDisplayStatus } from './client/features/deployments/display'
import { normalizeUsersState } from './client/features/users/state'
import { createMessageAssembler, readMessageSnapshots } from './client/features/chat/messages'

// This test-only declaration supports Node type packages that predate node:test.
const { test } = require('node:test') as {
  test(name: string, run: () => void | Promise<void>): void
}

const user = { id: 'u1', name: 'Fernando' }
const error = { message: 'Connection lost' }
const append = (sequence: number, text: string) => ({ kind: 'append', messageId: 'm1', sequence, text })
const done = { kind: 'done', messageId: 'm1', sequence: 2 }

test('request schema rejects unknown keys and empty identifiers', () => {
  assert.throws(() => GetUserInput.parse({ id: '' }))
  assert.throws(() => GetUserInput.parse({ id: 'u1', isAdmin: true }))
})

test('service authorizes access and strips internal database fields', async () => {
  const lookups: Parameters<UsersDatabase['findById']>[0][] = []
  const db: UsersDatabase = {
    async findById(input) { lookups.push(input); return { ...user, teamId: 't1' } },
  }
  assert.deepEqual(await getById(db, { id: 'caller', teamIds: ['t1'] }, { id: 'u1' }), {
    kind: 'found', user,
  })
  assert.deepEqual(await getById(db, { id: 'caller', teamIds: [] }, { id: 'u1' }), {
    kind: 'unavailable',
  })
  assert.deepEqual(lookups, [
    { id: 'u1', scope: { teamIds: ['t1'] } },
    { id: 'u1', scope: { teamIds: [] } },
  ])
})

test('service rejects records outside the supplied scope even when the DB adapter violates it', async () => {
  const wrongTenant: UsersDatabase = {
    async findById(input) {
      assert.deepEqual(input, { id: 'u1', scope: { teamIds: ['t1'] } })
      return { ...user, teamId: 't2' }
    },
  }
  const actor = { id: 'caller', teamIds: ['t1'] }
  assert.deepEqual(await getById(wrongTenant, actor, { id: 'u1' }), { kind: 'unavailable' })
  const wrongUser: UsersDatabase = {
    async findById() { return { ...user, id: 'u2', teamId: 't1' } },
  }
  assert.deepEqual(await getById(wrongUser, actor, { id: 'u1' }), { kind: 'unavailable' })
})

test('unauthorized and absent records share the same public outcome', async () => {
  const db: UsersDatabase = { async findById() { return undefined } }
  assert.deepEqual(await getById(db, { id: 'caller', teamIds: [] }, { id: 'u1' }), {
    kind: 'unavailable',
  })
})

test('invalid input is rejected before touching the database', async () => {
  let calls = 0
  const db: UsersDatabase = { async findById() { calls++; return undefined } }
  await assert.rejects(getById(db, { id: 'caller', teamIds: [] }, { id: '' }))
  assert.equal(calls, 0)
})

test('deployment display metadata is exhaustive and rejects unknown wire values', () => {
  assert.deepEqual(getDisplayStatus('ready'), { label: 'Ready', tone: 'positive' })
  for (const status of ['queued', 'building', 'ready', 'failed'] as const) {
    assert.ok(getDisplayStatus(status).label)
  }
  // @ts-expect-error Unknown statuses are also rejected by the type contract.
  assert.throws(() => getDisplayStatus('unexpected'))
  const metadata = getDisplayStatus('ready')
  assert.ok(Object.isFrozen(metadata))
})

test('awaiting idle, paused, and actively loading are distinct', () => {
  for (const [fetchStatus, activity] of [['idle', 'idle'], ['paused', 'paused'], ['fetching', 'loading']] as const) {
    assert.deepEqual(normalizeUsersState({ status: 'pending', fetchStatus }), { kind: 'awaiting', activity })
  }
})

test('successful empty data is not initial loading', () => {
  assert.deepEqual(normalizeUsersState({ status: 'success', fetchStatus: 'idle', data: [] }), {
    kind: 'empty', refresh: { kind: 'idle' },
  })
  assert.throws(() => UsersState.parse({ kind: 'content', users: [], refresh: { kind: 'idle' } }))
  // @ts-expect-error Content is a nonempty tuple at the type boundary as well.
  const impossible: UsersState = { kind: 'content', users: [], refresh: { kind: 'idle' } }
  assert.throws(() => UsersState.parse(impossible))
})

test('background loading preserves content, including an already-known empty result', () => {
  assert.deepEqual(normalizeUsersState({ status: 'success', fetchStatus: 'fetching', data: [user] }), {
    kind: 'content', users: [user], refresh: { kind: 'refreshing' },
  })
  assert.deepEqual(normalizeUsersState({ status: 'success', fetchStatus: 'paused', data: [] }), {
    kind: 'empty', refresh: { kind: 'paused' },
  })
})

test('initial failures and stale refresh failures have different contracts', () => {
  assert.deepEqual(normalizeUsersState({ status: 'error', fetchStatus: 'idle', error }), {
    kind: 'failed', error, activity: 'idle',
  })
  for (const data of [[], [user]]) {
    const state = normalizeUsersState({ status: 'error', fetchStatus: 'fetching', data, error })
    assert.ok(state.kind === 'empty' || state.kind === 'content')
    assert.deepEqual(state.refresh, { kind: 'failed', error, activity: 'loading' })
  }
  // @ts-expect-error A successful response always contains data.
  const impossible: QuerySnapshot = { status: 'success', fetchStatus: 'idle' }
  assert.throws(() => normalizeUsersState(impossible))
})

test('stream assembler produces immutable, independent whole-message snapshots', () => {
  const assembler = createMessageAssembler('m1')
  const first = assembler.push(append(0, 'Hello'))
  const second = assembler.push(append(1, ', world'))
  assert.deepEqual(first, { id: 'm1', text: 'Hello', complete: false })
  assert.deepEqual(second, { id: 'm1', text: 'Hello, world', complete: false })
  assert.ok(Object.isFrozen(first))
  assert.notEqual(first, second)
  assert.deepEqual(assembler.push(done), { id: 'm1', text: 'Hello, world', complete: true })
  assert.throws(() => assembler.push({ ...done, sequence: 3 }), /already complete/)
})

test('invalid events do not advance or corrupt the stream assembler', () => {
  const assembler = createMessageAssembler('m1')
  assert.throws(() => assembler.push({ ...append(0, 'bad'), text: 42 }))
  assert.throws(() => assembler.push({ ...append(0, 'bad'), messageId: 'm2' }), /message ID/)
  assert.throws(() => assembler.push(append(1, 'bad')), /sequence/)
  assert.equal(assembler.push(append(0, 'good')).text, 'good')
  assert.throws(() => assembler.push(append(0, 'duplicate')), /sequence/)
  assert.equal(assembler.push(append(1, '!')).text, 'good!')
})

function streamOf(values: unknown[], onCancel = () => {}) {
  return new ReadableStream<unknown>({
    start(controller) { values.forEach(value => controller.enqueue(value)); controller.close() },
    cancel: onCancel,
  })
}

test('stream consumer returns assembled snapshots and rejects truncated/malformed streams', async () => {
  const snapshots = []
  for await (const snapshot of readMessageSnapshots(streamOf([append(0, 'a'), append(1, 'b'), done]), 'm1')) {
    snapshots.push(snapshot)
  }
  assert.deepEqual(snapshots.map(snapshot => snapshot.text), ['a', 'ab', 'ab'])
  assert.equal(snapshots.at(-1)?.complete, true)
  await assert.rejects(async () => {
    for await (const _ of readMessageSnapshots(streamOf([append(0, 'a')]), 'm1')) { /* consume */ }
  }, /before message completed/)
  await assert.rejects(async () => {
    for await (const _ of readMessageSnapshots(streamOf([{ kind: 'wrong' }]), 'm1')) { /* consume */ }
  })
})

test('abort unblocks a pending read, cancels the source, and releases its lock', async () => {
  let cancellations = 0
  const stream = new ReadableStream<unknown>({ cancel() { cancellations++ } })
  const controller = new AbortController()
  const iterator = readMessageSnapshots(stream, 'm1', controller.signal)
  const read = iterator.next()
  controller.abort(new Error('User cancelled'))
  await assert.rejects(read, /User cancelled/)
  assert.equal(cancellations, 1)
  assert.equal(stream.locked, false)
})

test('pre-aborted signals and early consumer exit release the source', async () => {
  const controller = new AbortController()
  controller.abort(new Error('Already cancelled'))
  const abortedStream = new ReadableStream<unknown>()
  await assert.rejects(readMessageSnapshots(abortedStream, 'm1', controller.signal).next(), /Already cancelled/)
  assert.equal(abortedStream.locked, false)

  let cancelled = false
  const stream = new ReadableStream<unknown>({
    start(controller) { controller.enqueue(append(0, 'a')) },
    cancel() { cancelled = true },
  })
  for await (const _ of readMessageSnapshots(stream, 'm1')) break
  assert.equal(cancelled, true)
  assert.equal(stream.locked, false)
})

test('stream cleanup cannot mask the original protocol failure', async () => {
  const stream = new ReadableStream<unknown>({
    start(controller) { controller.enqueue({ ...append(0, 'wrong'), messageId: 'm2' }) },
    cancel() { throw new Error('Cleanup failed') },
  })
  await assert.rejects(readMessageSnapshots(stream, 'm1').next(), /Unexpected message ID/)
  assert.equal(stream.locked, false)
})

test('cleanup errors remain visible when no earlier protocol failure exists', async () => {
  const stream = new ReadableStream<unknown>({
    start(controller) { controller.enqueue({ kind: 'done', messageId: 'm1', sequence: 0 }) },
    cancel() { throw new Error('Cleanup failed') },
  })
  const iterator = readMessageSnapshots(stream, 'm1')
  assert.equal((await iterator.next()).value?.complete, true)
  await assert.rejects(iterator.next(), /Cleanup failed/)
  assert.equal(stream.locked, false)
})
