import { useState, useEffect } from 'react';

const SIMULATED_OFFLINE_KEY = 'dailybugle_simulated_offline';

export function useOnlineStatus() {
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
  });

  const [isNavigatorOnline, setIsNavigatorOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsNavigatorOnline(true);
    const handleOffline = () => setIsNavigatorOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isOnline = isNavigatorOnline && !isSimulatedOffline;

  const toggleSimulateOffline = () => {
    setIsSimulatedOffline(prev => {
      const next = !prev;
      localStorage.setItem(SIMULATED_OFFLINE_KEY, String(next));
      return next;
    });
  };

  const setSimulatedOffline = (offline: boolean) => {
    setIsSimulatedOffline(offline);
    localStorage.setItem(SIMULATED_OFFLINE_KEY, String(offline));
  };

  return {
    isOnline,
    isSimulatedOffline,
    toggleSimulateOffline,
    setSimulatedOffline,
  };
}
