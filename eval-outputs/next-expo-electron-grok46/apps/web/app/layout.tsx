import type { ReactNode } from 'react'
import { QueryProvider } from '@example/features/app/next'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
