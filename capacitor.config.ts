import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'FixHo-app',
  webDir: 'www',
  plugins: {
    LiveUpdates: {
      appId: '7a761a3d',
      channel: 'Production',
      autoUpdateMethod: 'background',
      maxVersions: 3
    }
  }
};

export default config;
