import { MessageEvent, MessageSnapshot } from '../../../core/features/chat/schema'

// This protocol deliberately demonstrates only ordered append-text patches.
// JSON Patch, binary attachments, resume tokens and reconnects need contracts of
// their own; callers should still receive assembled snapshots from the SDK.
export function createMessageAssembler(messageId: string) {
  let snapshot = MessageSnapshot.parse({ id: messageId, text: '', complete: false })
  let nextSequence = 0
  return {
    get complete() { return snapshot.complete },
    push(value: unknown): MessageSnapshot {
      const event = MessageEvent.parse(value)
      if (snapshot.complete) throw new Error('Message already complete')
      if (event.messageId !== messageId) throw new Error('Unexpected message ID')
      if (event.sequence !== nextSequence) throw new Error('Unexpected message sequence')
      // Validate before committing state; malformed events cannot corrupt it.
      const next = MessageSnapshot.parse({
        id: messageId,
        text: snapshot.text + (event.kind === 'append' ? event.text : ''),
        complete: event.kind === 'done',
      })
      snapshot = next
      nextSequence += 1
      return snapshot
    },
  }
}

// Transport adapters decode bytes/SSE frames to unknown values before this layer.
export async function* readMessageSnapshots(
  stream: ReadableStream<unknown>,
  messageId: string,
  signal?: AbortSignal,
): AsyncGenerator<MessageSnapshot> {
  const assembler = createMessageAssembler(messageId)
  const reader = stream.getReader()
  let hasPrimaryFailure = false
  const cancel = () => { void reader.cancel(signal?.reason).catch(() => {}) }
  signal?.addEventListener('abort', cancel, { once: true })
  try {
    signal?.throwIfAborted()
    while (true) {
      const result = await reader.read()
      signal?.throwIfAborted()
      if (result.done) throw new Error('Stream ended before message completed')
      const snapshot = assembler.push(result.value)
      yield snapshot
      if (snapshot.complete) return
    }
  } catch (error) {
    hasPrimaryFailure = true
    throw error
  } finally {
    signal?.removeEventListener('abort', cancel)
    // Runs on completion, malformed input, abort, and early consumer return.
    try {
      await reader.cancel()
    } catch (error) {
      // Preserve the protocol/abort failure that actually caused termination.
      if (!hasPrimaryFailure) throw error
    } finally {
      reader.releaseLock()
    }
  }
}
