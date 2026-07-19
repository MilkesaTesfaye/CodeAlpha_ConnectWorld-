import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function SidebarLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 to-white dark:from-dark-950 dark:to-dark-900 flex">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
