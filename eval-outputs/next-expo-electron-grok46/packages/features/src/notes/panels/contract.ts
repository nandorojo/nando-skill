import { Schema } from '@example/libraries/effect'

export const PanelPlacement = Schema.Literal('list', 'editor')
export type PanelPlacement = typeof PanelPlacement.Type

export const PanelsState = Schema.Struct({
  order: Schema.Array(PanelPlacement),
})
export type PanelsState = typeof PanelsState.Type

export interface PanelsContract {
  state: PanelsState
  actions: {
    move(placement: PanelPlacement, index: number): void
  }
}
