import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { TUTORIAL_SEEN_KEY } from '../constants/storageKeys';

function tutorialSeen(): boolean {
  try {
    return sessionStorage.getItem(TUTORIAL_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

/** 冷启动根路径：已登录 → 菜单；未登录已看过引导 → 登录；否则 → 教程 */
export default function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/menu" replace />;
  if (tutorialSeen()) return <Navigate to="/login" replace />;
  return <Navigate to="/tutorial" replace />;
}
