import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sabuat.apapacho',
  appName: 'Apapacho',
  webDir: 'out',
  // @ts-ignore
  plugins: {
    StatusBar: {
      hidden: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'PEGA_AQUI_TU_WEB_CLIENT_ID', // <-- ¡Acuérdate de pegar tu código real aquí!
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;