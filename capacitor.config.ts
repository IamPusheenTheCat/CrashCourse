import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.crashcourse.app',
  appName: 'CrashCourse',
  webDir: 'dist',
  // WebView 页面是 https://localhost，请求 http://10.0.2.2（本机后端）属于混合内容，默认会被拦截；开发联调需开启
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 0,
    },
  },
};

export default config;
