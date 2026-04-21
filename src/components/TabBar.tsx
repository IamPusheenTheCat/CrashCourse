import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/quiz', icon: 'fa-th-large', label: 'Quiz' },
  { to: '/profile', icon: 'fa-user', label: 'Profile' },
] as const;

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-start justify-center"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom, 24px))',
        paddingBottom: 'env(safe-area-inset-bottom, 24px)',
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.35)',
      }}
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-medium transition-colors ${
              isActive ? 'text-cc-fg' : 'text-cc-muted'
            }`
          }
        >
          <i className={`fas ${t.icon} text-[22px] mb-0.5`} />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
