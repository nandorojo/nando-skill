import { Heading, Stack, Text } from '@example/design-system/react'

export function WebHome() {
  return (
    <Stack className="gap-3 p-6">
      <Heading>Grok 4.6 skill eval</Heading>
      <Text>Two mocked features: notes and tasks. Routes exist so the consumption story can be walked; they do not persist data.</Text>
    </Stack>
  )
}
