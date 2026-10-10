import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.myfit.app',
  appName: 'MyFit',
  webDir: 'dist',
  backgroundColor: '#191a1f',
  android: {
    backgroundColor: '#191a1f',
  },
  plugins: {
    // Only Google sign-in is used (turn on `apple` when the iPhone app is added).
    SocialLogin: {
      providers: { google: true, facebook: false, apple: false, twitter: false },
    },
  },
}

export default config
