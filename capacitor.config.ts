import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.myfit.app',
  appName: 'MyFit',
  webDir: 'dist',
  backgroundColor: '#191a1f',
  android: {
    backgroundColor: '#191a1f',
  },
  ios: {
    backgroundColor: '#191a1f',
    // Keeps the page below the notch / status bar and above the home bar.
    contentInset: 'always',
  },
  plugins: {
    // Only Google sign-in is used. Apple requires "Sign in with Apple" whenever Google sign-in is offered, so turn on
    // `apple` (and add the sign-in button) before enabling Google sign-in in the iPhone app.
    SocialLogin: {
      providers: { google: true, facebook: false, apple: false, twitter: false },
    },
  },
}

export default config
