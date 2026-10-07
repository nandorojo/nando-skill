type SearchPatch = Readonly<Record<string, string | null>>

export function updateHashRoute(path: string, patch: SearchPatch = {}) {
  const url = new URL(path, 'app://renderer')
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) url.searchParams.delete(key)
    else url.searchParams.set(key, value)
  }
  window.location.hash = url.pathname + url.search
}

export function useUpdateHashRoute() {
  return updateHashRoute
}
