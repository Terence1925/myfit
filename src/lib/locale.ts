// Whether to talk to the person in a Filipino / English mix ("Taglish"). OFF for everyone by default: the app speaks plain
// English. It can still be switched on for testing or a future setting: localStorage `myfit_taglish` = '1' (on).
export function taglishOn(): boolean {
  try {
    return localStorage.getItem('myfit_taglish') === '1'
  } catch {
    return false
  }
}

export function setTaglish(on: boolean) {
  try {
    localStorage.setItem('myfit_taglish', on ? '1' : '0')
  } catch {
    /* nothing to do */
  }
}
