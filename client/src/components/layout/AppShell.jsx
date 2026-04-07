import { Outlet, useLocation } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import Footer from './Footer';

const sectionLabels = {
  '/profile': 'VAULT',
  '/history': 'RESUMES',
  '/tailor': 'TAILOR',
};

export default function AppShell() {
  const { pathname } = useLocation();
  const sectionLabel = sectionLabels[pathname] || 'SYSTEM';

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-surface">
          <Outlet />
        </main>
      </div>
      <Footer sectionLabel={sectionLabel} />
    </div>
  );
}
