/**
 * Weight entries are saved at midnight UTC of the day the person picked (for example 2026-11-05T00:00:00.000Z).
 * Showing that moment in the phone's own time zone puts it on the evening before for anyone west of UTC (the Americas),
 * so the day has to be read in UTC, which is how it was saved.
 */
export function entryDate(iso: string, locale?: string): string {
  return new Date(iso).toLocaleDateString(locale, { timeZone: 'UTC' })
}
