import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ci.daxas',
  appName: 'DaxAs',
  webDir: 'www',
  plugins: {
    LiveUpdates: {
      appId: 'ci.daxas',
      channel: 'Development',
      autoUpdateMethod: 'background',
      maxVersions: 3
    }
  }
};

export default config;
