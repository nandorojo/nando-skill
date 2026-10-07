import { NativeAppProvider } from '@example/features/app/native'
import { Slot } from 'expo-router'

export default function RootLayout() {
  return (
    <NativeAppProvider>
      <Slot />
    </NativeAppProvider>
  )
}
