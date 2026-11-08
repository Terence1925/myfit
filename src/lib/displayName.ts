/** Shows a name with each word starting with a capital: "terence tagayona" -> "Terence Tagayona". The stored name is not changed. */
export function displayName(name: string | null | undefined): string {
  return (name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/** The first name, capitalized: "terence tagayona" -> "Terence". */
export function firstNameOf(name: string | null | undefined): string | undefined {
  const first = displayName(name).split(' ')[0]
  return first || undefined
}
