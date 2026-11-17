import * as React from 'react'

// Whether the exercise cards show their details (sets, reps, coaching notes and the Swap, Custom, Demo and History buttons)
// or only the logging part. It is one choice for every card, remembered on the phone.

const KEY = 'myfit_hide_exercise_details'
const EVENT = 'myfit:exercise-details'

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setHideExerciseDetails(hidden: boolean): void {
  try {
    localStorage.setItem(KEY, hidden ? '1' : '0')
  } catch {
    /* private mode etc.: the choice just is not remembered */
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** [hidden, set]: every card using this stays in step. */
export function useHideExerciseDetails(): [boolean, (hidden: boolean) => void] {
  const hidden = React.useSyncExternalStore(subscribe, read, () => false)
  return [hidden, setHideExerciseDetails]
}
