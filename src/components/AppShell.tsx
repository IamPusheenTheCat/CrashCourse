import { createContext, useContext, useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import StatusBar from './StatusBar';
import TabBar from './TabBar';

const HideTabCtx = createContext<(hide: boolean) => void>(() => {});
export const useHideTab = () => useContext(HideTabCtx);

/** Quiz 与从 Quiz 切到的 Profile 显示底栏；菜单直达 Profile 不显示（无 Quiz 上下文） */
const PAGES_WITH_TAB = ['/quiz', '/profile'];

type ProfileLocationState = { profileFromMenu?: boolean };

export default function AppShell() {
  const { pathname, state } = useLocation();
  const [tabHidden, setTabHidden] = useState(false);
  const hideTab = useCallback((hide: boolean) => setTabHidden(hide), []);
  const profileFromMenu =
    pathname === '/profile' && (state as ProfileLocationState | null)?.profileFromMenu === true;
  const showTab = PAGES_WITH_TAB.includes(pathname) && !tabHidden && !profileFromMenu;

  return (
    <HideTabCtx.Provider value={hideTab}>
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
    </HideTabCtx.Provider>
  );
}
