import { EXERCISES } from './backend/exerciseLibrary'
import { EXERCISE_VIDEOS, type ExerciseVideo } from './exerciseVideos'

/** The hand-picked demo video for an exercise, or null when there isn't one yet. */
export function videoFor(exerciseName: string): ExerciseVideo | null {
  return EXERCISE_VIDEOS[exerciseName] ?? null
}

/** What to search YouTube for: a yoga pose, a Pilates move, or a lifting exercise each read differently. */
function searchTerm(exerciseName: string): string {
  const ex = EXERCISES.find((e) => e.name === exerciseName)
  const yoga = ex?.equipment.includes('yoga')
  const pilates = ex?.equipment.includes('pilates')
  if (yoga && pilates) return `${exerciseName} stretch tutorial`
  if (yoga) return `${exerciseName} yoga pose tutorial for beginners`
  if (pilates) return `${exerciseName} mat pilates exercise tutorial`
  return `${exerciseName} exercise form tutorial`
}

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined
const CACHE_KEY = 'myfit_youtube_cache'

function readCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** For exercises that have no hand-picked video yet: look up the top YouTube result live (cached on the device).
 * Returns null when there is no API key or the lookup fails. */
export async function findExerciseVideoId(exerciseName: string): Promise<string | null> {
  if (!API_KEY) return null
  const cache = readCache()
  if (cache[exerciseName]) return cache[exerciseName]
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&videoEmbeddable=true&q=${encodeURIComponent(searchTerm(exerciseName))}&key=${API_KEY}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const videoId: string | undefined = data.items?.[0]?.id?.videoId
    if (!videoId) return null
    cache[exerciseName] = videoId
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    return videoId
  } catch {
    return null
  }
}

/** Title for the demo window: poses for yoga, form for everything else. */
export function demoTitle(exerciseName: string): string {
  const ex = EXERCISES.find((e) => e.name === exerciseName)
  if (ex?.equipment.includes('yoga') && !ex.equipment.includes('pilates')) return `${exerciseName} — Pose Demo`
  if (ex?.equipment.includes('pilates') && !ex.equipment.includes('yoga')) return `${exerciseName} — Move Demo`
  return `${exerciseName} — Form Demo`
}

export function searchUrl(exerciseName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm(exerciseName))}`
}

export function watchUrl(video: ExerciseVideo): string {
  return `https://www.youtube.com/watch?v=${video.id}`
}

/** The in-app player ("nocookie" avoids tracking cookies; playsinline keeps it inside the app on phones). */
export function embedUrl(video: ExerciseVideo): string {
  return `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
}
