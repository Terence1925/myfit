import * as React from 'react'
import { App } from '@capacitor/app'
import { nativePlatform } from '@/lib/platform'

/**
 * The Android Back button: back one page, and out of the app from the first screen. Without this, Back does nothing on
 * the first screen, because the default only goes back when there is a page to go back to.
 */
export function useAndroidBack() {
  React.useEffect(() => {
    if (nativePlatform() !== 'android') return
    let remove: (() => void) | undefined
    let stopped = false

    void App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back()
      else void App.exitApp()
    }).then((handle) => {
      if (stopped) void handle.remove()
      else remove = () => void handle.remove()
    })
    return () => {
      stopped = true
      remove?.()
    }
  }, [])
}
