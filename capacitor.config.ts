import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rfid.desktopmanager',
  appName: 'RFID Manager',
  webDir: 'out',
  server: {
    // URL del server Next.js in esecuzione sulla LAN
    // Cambia questo IP con quello del server dove gira npm start
    url: 'http://localhost:3000',
    cleartext: true,
    androidScheme: 'http',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
