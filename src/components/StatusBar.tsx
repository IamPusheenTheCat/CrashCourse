import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

function formatStatusTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: undefined,
  });
}

export default function StatusBar() {
  const [now, setNow] = useState(() => new Date());

  // Web/browser: fake status bar — show real local time (was hardcoded 9:41 like Apple marketing)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 1000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // On a real device, iOS provides the real status bar — don't render a fake one
  if (Capacitor.isNativePlatform()) {
    return <div style={{ height: 'env(safe-area-inset-top, 44px)' }} />;
  }

  return (
    <div className="h-11 px-5 flex items-center justify-between text-sm font-semibold text-white relative z-10">
      <span className="tracking-wide tabular-nums">{formatStatusTime(now)}</span>
      <div className="flex items-center gap-1 text-sm">
        <i className="fas fa-signal" />
        <i className="fas fa-wifi" />
        <i className="fas fa-battery-full" />
      </div>
    </div>
  );
}
