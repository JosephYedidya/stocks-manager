import { useState, useEffect } from 'react';
import { offlineStorage } from '../utils/storage.js';
import { message } from 'antd';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(offlineStorage.pendingCount());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    if (syncing || offlineStorage.pendingCount() === 0) return;
    
    setSyncing(true);
    const pending = offlineStorage.getPending();
    
    for (const sale of pending) {
      try {
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale)
        });
        if (response.ok) {
          offlineStorage.clearPending();
        }
      } catch {
        // Retry later
      }
    }
    
    setSyncing(false);
    setPendingCount(offlineStorage.pendingCount());
    message.success('Synced!');
  };

  return { isOnline, pendingCount, syncing, syncData };
};

