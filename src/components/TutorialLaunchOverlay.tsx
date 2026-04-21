import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { useAuthStore } from '../stores/authStore';

const isAndroid = Capacitor.getPlatform() === 'android';
const OVERLAY_BG = '#1a1a2e';
const FADE_MS = 400;

/**
 * Android：原生 Splash 隐藏后用全屏遮罩盖住，等教程首帧 playing 再淡出，
 * 避免 WebView 未解码视频时出现黑底 + 播放三角。
 *
 * 从设置、登录等路由**进入**未登录 /tutorial 时重新显示遮罩（并重置 doneRef），
 * logout 后与冷启动一致；在 /login 等非教程页不注册监听并收起遮罩，避免误挡界面。
 */
export default function TutorialLaunchOverlay() {
  const { pathname } = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [overlayGone, setOverlayGone] = useState(!isAndroid);
  const [overlayFading, setOverlayFading] = useState(false);
  const doneRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!isAndroid) return;
    void SplashScreen.hide();
  }, []);

  useEffect(() => {
    if (!isAndroid || !isAuthenticated) return;
    dismissOverlay();
  }, [isAndroid, isAuthenticated, dismissOverlay]);

  useEffect(() => {
    if (!isAndroid) return;

    if (pathname !== '/tutorial' || isAuthenticated) {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      setOverlayGone(true);
      setOverlayFading(false);
      doneRef.current = false;
      prevPathRef.current = pathname;
      return;
    }

    const enteredFromElsewhere = prevPathRef.current !== '/tutorial';
    prevPathRef.current = pathname;

    if (enteredFromElsewhere) {
      doneRef.current = false;
      setOverlayFading(false);
      setOverlayGone(false);
    }

    const onTutorialPlaying = () => dismissOverlay();
    window.addEventListener('tutorial-first-frame-playing', onTutorialPlaying);
    fallbackTimerRef.current = setTimeout(onTutorialPlaying, 30 * 1000);

    return () => {
      window.removeEventListener('tutorial-first-frame-playing', onTutorialPlaying);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [pathname, isAuthenticated, dismissOverlay]);

  if (!isAndroid || overlayGone) return null;

  return (
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
  );
}
