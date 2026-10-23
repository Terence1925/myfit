import * as React from 'react'

// Lifting weights are always SAVED in pounds (so every workout ever logged keeps working), and shown and typed in the unit the
// person chose: pounds or kilograms. The choice lives on the device. When nothing has been chosen yet, it follows the unit
// picked for body weight in the sign-up questions.
export type WeightUnit = 'lbs' | 'kg'

const KEY = 'myfit_weight_unit'
const EVENT = 'myfit:weight-unit-changed'
export const KG_PER_LB = 0.45359237

/** The saved choice, or null when the person has not chosen one. */
export function storedWeightUnit(): WeightUnit | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'kg' || v === 'lbs' ? v : null
  } catch {
    return null
  }
}

export function loadWeightUnit(): WeightUnit {
  return storedWeightUnit() ?? 'lbs'
}

export function saveWeightUnit(unit: WeightUnit): void {
  try {
    localStorage.setItem(KEY, unit)
  } catch {
    // storage blocked: the choice just will not be remembered
  }
  window.dispatchEvent(new Event(EVENT))
}

/** Use the unit from the sign-up questions, unless the person has already chosen one. */
export function adoptWeightUnit(fromAnswers: WeightUnit | undefined): void {
  if (fromAnswers && storedWeightUnit() === null) saveWeightUnit(fromAnswers)
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** A weight saved in pounds, as a number in the chosen unit (tidy to 2 decimals). */
export function toUnit(lbs: number, unit: WeightUnit): number {
  return unit === 'kg' ? round2(lbs * KG_PER_LB) : round2(lbs)
}

/** A number typed in the chosen unit, as pounds for saving. */
export function toLbs(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value / KG_PER_LB : value
}

/** "62.5", "60": up to one decimal, no trailing zero. */
export function fmtNumber(n: number): string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

/** The short name used next to a number: "lb" or "kg". */
export const unitShort = (unit: WeightUnit) => (unit === 'kg' ? 'kg' : 'lb')

/** The plural word used for totals: "lbs" or "kg". */
export const unitLabel = (unit: WeightUnit) => (unit === 'kg' ? 'kg' : 'lbs')

/** The chosen unit, updating every screen when it changes. */
export function useWeightUnit(): [WeightUnit, (u: WeightUnit) => void] {
  const subscribe = React.useCallback((cb: () => void) => {
    window.addEventListener(EVENT, cb)
    window.addEventListener('storage', cb)
    return () => {
      window.removeEventListener(EVENT, cb)
      window.removeEventListener('storage', cb)
    }
  }, [])
  const unit = React.useSyncExternalStore(subscribe, loadWeightUnit, () => 'lbs' as WeightUnit)
  return [unit, saveWeightUnit]
}
