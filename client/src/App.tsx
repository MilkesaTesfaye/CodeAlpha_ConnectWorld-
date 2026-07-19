import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

function App() {
  const { fetchUser, isAuthenticated } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser().finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-dark-950 dark:to-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-dark-500 dark:text-dark-400 text-sm font-medium">
            Loading ConnectWorld...
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default App;
