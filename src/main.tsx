import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';
import App from './App';
import { hydrateRefreshTokenFromNative } from './auth/refreshTokenStorage';
import { runStartupAuthSync } from './api/client';

/** 等 React 提交首帧后再关原生启动图，减轻 WebView 白屏间隙（浏览器无操作） */
function scheduleHideNativeSplash() {
  if (!Capacitor.isNativePlatform()) return;
  const hide = () => {
    void SplashScreen.hide({ fadeOutDuration: 240 }).catch(() => {
      /* 非原生或插件未就绪时忽略 */
    });
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(hide);
  });
}

async function bootstrap() {
  await hydrateRefreshTokenFromNative();
  await runStartupAuthSync();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  scheduleHideNativeSplash();
}

void bootstrap();
