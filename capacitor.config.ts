import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sabuat.apapacho',
  appName: 'Apapacho',
  webDir: 'out',
  // @ts-ignore
  plugins: {
    StatusBar: {
      overlaysWebView: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '324709863952-ccc9aukqh0594adthg76d9aak00iu4bh.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;