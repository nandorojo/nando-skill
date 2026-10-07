export const tokens = {
  space: { 2: '0.5rem', 3: '0.75rem', 4: '1rem', 6: '1.5rem' },
  tone: {
    neutral: 'neutral',
    info: 'info',
    positive: 'positive',
    danger: 'danger',
  },
} as const

export type Tone = (typeof tokens.tone)[keyof typeof tokens.tone]
