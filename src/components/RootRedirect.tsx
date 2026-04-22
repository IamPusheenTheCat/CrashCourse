import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/** 冷启动根路径：已登录 → 菜单，否则 → 登录 */
export default function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/menu" replace />;
  return <Navigate to="/login" replace />;
}
