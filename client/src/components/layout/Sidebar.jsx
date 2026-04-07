import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/profile', icon: 'inventory_2', label: 'Vault' },
  { to: '/history', icon: 'description', label: 'Resumes' },
  { to: '/tailor', icon: 'add_box', label: 'New Job' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-full flex flex-col bg-surface-container-lowest border-r border-outline-variant">
      {/* Branding */}
      <div className="px-6 pt-6 pb-4">
        <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
          Technical Manuscript v1.0
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mb-1 font-display text-xs font-medium uppercase tracking-widest transition-colors duration-100 ${
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface hover:bg-surface-container'
              }`
            }
          >
            <span className="material-symbols-outlined text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* System Status */}
      <div className="px-6 py-4 border-t border-outline-variant">
        <p className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant mb-2">
          System Status
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-tertiary inline-block" />
          <span className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-tertiary">
            AI Engine Active
          </span>
        </div>
      </div>
    </aside>
  );
}
