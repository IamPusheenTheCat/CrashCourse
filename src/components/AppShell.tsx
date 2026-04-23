import { Outlet, useLocation } from 'react-router-dom';
import StatusBar from './StatusBar';
import TabBar from './TabBar';

/** 仅 Profile（从会话内进入）显示底栏；Quiz 用顶栏回菜单，底栏无意义。菜单直达 Profile 不显示 */
const PAGES_WITH_TAB = ['/profile'];

type ProfileLocationState = { profileFromMenu?: boolean };

export default function AppShell() {
  const { pathname, state } = useLocation();
  const profileFromMenu =
    pathname === '/profile' && (state as ProfileLocationState | null)?.profileFromMenu === true;
  const showTab = PAGES_WITH_TAB.includes(pathname) && !profileFromMenu;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="app-bg" />

      <div className="relative z-1">
        <StatusBar />
        <main
          className="px-5"
          style={{
            paddingBottom: showTab
              ? 'calc(64px + env(safe-area-inset-bottom, 24px) + 16px)'
              : 'env(safe-area-inset-bottom, 24px)',
          }}
        >
          <Outlet />
        </main>
      </div>

      {showTab && <TabBar />}
    </div>
  );
}
