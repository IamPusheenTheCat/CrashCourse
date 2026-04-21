import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { readGuestTutorialIntroDone } from '../constants/storageKeys';

/**
 * 冷启动根路径：
 * - 已登录 → 菜单（教程仅在未登录时完成，见 Login 成功后的 markUserTutorialDone）
 * - 未登录、访客已看过引导 → 登录
 * - 未登录、否则 → 教程
 */
export default function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/menu" replace />;
  if (readGuestTutorialIntroDone()) return <Navigate to="/login" replace />;
  return <Navigate to="/tutorial" replace />;
}
