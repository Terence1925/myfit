const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined

export const isYoutubeApiConfigured = Boolean(API_KEY)

const CACHE_KEY = 'forgefit_youtube_cache'

function readCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeCache(cache: Record<string, string>) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

export function searchUrl(exerciseName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} exercise form tutorial`)}`
}

/** Looks up the top matching video for an exercise, caching results in localStorage
 * so repeat views (and the YouTube Data API's daily quota) stay cheap. Returns null
 * if no API key is configured or the lookup fails — callers should fall back to
 * linking out to a YouTube search instead. */
export async function findExerciseVideoId(exerciseName: string): Promise<string | null> {
  if (!API_KEY) return null

  const cache = readCache()
  if (cache[exerciseName]) return cache[exerciseName]

  try {
    const query = `${exerciseName} exercise form tutorial`
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&videoEmbeddable=true&q=${encodeURIComponent(query)}&key=${API_KEY}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const videoId: string | undefined = data.items?.[0]?.id?.videoId
    if (!videoId) return null

    cache[exerciseName] = videoId
    writeCache(cache)
    return videoId
  } catch {
    return null
  }
}
