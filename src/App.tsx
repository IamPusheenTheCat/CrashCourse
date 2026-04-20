import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import RootRedirect from './components/RootRedirect';
import { useAuthStore } from './stores/authStore';
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [overlayGone, setOverlayGone] = useState(!isAndroid);
  const [overlayFading, setOverlayFading] = useState(false);
  const doneRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissOverlay = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setOverlayFading(true);
    fadeTimerRef.current = setTimeout(() => setOverlayGone(true), FADE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  // Android：先 hide Splash 让 WebView 正常加载/播视频，再用遮罩盖住，等可见视频 playing 再淡出遮罩。
  // 已登录用户可能不经教程直达 /menu，需同步 dismiss；从 Login 进入菜单同理。
  useEffect(() => {
    if (!isAndroid) return;
    SplashScreen.hide();
    const onTutorialPlaying = () => dismissOverlay();
    window.addEventListener('tutorial-first-frame-playing', onTutorialPlaying);
    fallbackTimerRef.current = setTimeout(onTutorialPlaying, 30 * 1000);
    if (useAuthStore.getState().isAuthenticated) onTutorialPlaying();
    return () => {
      window.removeEventListener('tutorial-first-frame-playing', onTutorialPlaying);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [dismissOverlay]);

  useEffect(() => {
    if (!isAndroid || !isAuthenticated) return;
    dismissOverlay();
  }, [isAndroid, isAuthenticated, dismissOverlay]);

  return (
    <>
      <BrowserRouter>
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
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter>
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
