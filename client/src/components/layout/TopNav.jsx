import { useAuth } from '../../context/AuthContext';

export default function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-surface border-b border-outline-variant">
      <h1 className="font-display text-lg font-bold tracking-wider uppercase m-0">
        JobButler
      </h1>
      <div className="flex items-center gap-6">
        {user && (
          <span className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
            {user.email}
          </span>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors duration-100"
          title="Sign out"
        >
          <span className="material-symbols-outlined text-xl">account_circle</span>
        </button>
      </div>
    </header>
  );
}
