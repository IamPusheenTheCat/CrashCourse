import { createContext, useContext, useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import StatusBar from './StatusBar';
import TabBar from './TabBar';

const HideTabCtx = createContext<(hide: boolean) => void>(() => {});
export const useHideTab = () => useContext(HideTabCtx);

/** 仅 Quiz / Profile 显示底栏切换；主页与设置等用页内返回 / Done */
const PAGES_WITH_TAB = ['/quiz', '/profile'];

export default function AppShell() {
  const { pathname } = useLocation();
  const [tabHidden, setTabHidden] = useState(false);
  const hideTab = useCallback((hide: boolean) => setTabHidden(hide), []);
  const showTab = PAGES_WITH_TAB.includes(pathname) && !tabHidden;

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
