'use client'

type SearchPatch = Readonly<Record<string, string | null>>

export function updateSearchParams(patch: SearchPatch) {
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) url.searchParams.delete(key)
    else url.searchParams.set(key, value)
  }
  window.history.pushState(null, '', url.pathname + url.search + url.hash)
}

export function useUpdateSearchParams() {
  return updateSearchParams
}
