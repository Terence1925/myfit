import * as React from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/backend/supabaseClient'
import { refreshTokenFromAppLink } from '@/lib/appLink'

/**
 * On the phone: when the app is opened from the password-reset page ("Open the MyFit app"), sign in with the login token in
 * the link and go to the home screen. Works whether the app was closed or already open in the background.
 */
export function useAppLinkSignIn() {
  const navigate = useNavigate()
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform() || !supabase) return
    const client = supabase
    let remove: (() => void) | undefined
    let stopped = false

    const signInFrom = async (url: string) => {
      const token = refreshTokenFromAppLink(url)
      if (!token) return
      const { error } = await client.auth.refreshSession({ refresh_token: token })
      if (!error && !stopped) navigate('/', { replace: true })
    }

    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) void signInFrom(launch.url)
    })
    void App.addListener('appUrlOpen', (event) => void signInFrom(event.url)).then((handle) => {
      if (stopped) void handle.remove()
      else remove = () => void handle.remove()
    })
    return () => {
      stopped = true
      remove?.()
    }
  }, [navigate])
}
