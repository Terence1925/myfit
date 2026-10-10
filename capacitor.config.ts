import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.forgefit.app',
  appName: 'FORGEFIT',
  webDir: 'dist',
  backgroundColor: '#0a0805',
  android: {
    backgroundColor: '#0a0805',
  },
  plugins: {
    // Only Google sign-in is used (turn on `apple` when the iPhone app is added).
    SocialLogin: {
      providers: { google: true, facebook: false, apple: false, twitter: false },
    },
  },
}

export default config
