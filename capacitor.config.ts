import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'FixHo-app',
  webDir: 'www',
  plugins: {
    LiveUpdates: {
      appId: '042a1261',
      channel: 'Production',
      autoUpdateMethod: 'background',
      maxVersions: 2
    }
  }
};

export default config;
