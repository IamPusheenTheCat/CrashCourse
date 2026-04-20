import { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import LoginScreen from './screens/LoginScreen';
import TutorialScreen from './screens/TutorialScreen';
import MenuScreen from './screens/MenuScreen';
import QuizScreen from './screens/QuizScreen';
import ReviewScreen from './screens/ReviewScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

const isAndroid = Capacitor.getPlatform() === 'android';
const OVERLAY_BG = '#1a1a2e';
const FADE_MS = 400;

export default function App() {
  const [overlayGone, setOverlayGone] = useState(!isAndroid);
  const [overlayFading, setOverlayFading] = useState(false);
  const doneRef = useRef(false);

  // Android：先 hide Splash 让 WebView 正常加载/播视频，再用遮罩盖住，等可见视频 playing 再淡出遮罩。
  useEffect(() => {
    if (!isAndroid) return;
    SplashScreen.hide();
    let fallbackTimer: ReturnType<typeof setTimeout>;
    let fadeTimer: ReturnType<typeof setTimeout>;
    const dismiss = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      setOverlayFading(true);
      fadeTimer = setTimeout(() => setOverlayGone(true), FADE_MS);
    };
    window.addEventListener('tutorial-first-frame-playing', dismiss);
    fallbackTimer = setTimeout(dismiss, 30 * 1000);
    return () => {
      window.removeEventListener('tutorial-first-frame-playing', dismiss);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/tutorial" element={<TutorialScreen />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/menu" element={<MenuScreen />} />
              <Route path="/quiz" element={<QuizScreen />} />
              <Route path="/review" element={<ReviewScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Route>
            <Route path="/" element={<Navigate to="/tutorial" replace />} />
            <Route path="*" element={<Navigate to="/tutorial" replace />} />
          </Route>
        </Routes>
      </HashRouter>
      {!overlayGone && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: OVERLAY_BG,
            opacity: overlayFading ? 0 : 1,
            transition: `opacity ${FADE_MS}ms ease-out`,
            pointerEvents: overlayFading ? 'none' : 'auto',
          }}
        />
      )}
    </>
  );
}
