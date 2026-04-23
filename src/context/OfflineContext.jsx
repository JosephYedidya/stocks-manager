import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage.js';
import { syncPending } from '../api/offlineClient.js';
import { message } from 'antd';

const OfflineContext = createContext();

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(storage.getPendingCount());
  const [isSyncing, setIsSyncing] = useState(false);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('🌐 Online - Starting sync...');
      
      if (pendingCount > 0) {
        await manualSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📴 Offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingCount]);

  // Watch pending count
  useEffect(() => {
    const id = setInterval(() => {
      const count = storage.getPendingCount();
      setPendingCount(count);
    }, 2000);

    return () => clearInterval(id);
  }, []);

  const manualSync = useCallback(async () => {
    if (!isOnline || pendingCount === 0 || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncPending();
      message.success(`✅ Synced ${pendingCount} transactions`);
      setPendingCount(0);
    } catch (e) {
      message.error('❌ Sync failed - Retrying later');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, pendingCount, isSyncing]);

  return (
    <OfflineContext.Provider value={{
      isOnline,
      pendingCount,
      isSyncing,
      manualSync
    }}>
      {children}
    </OfflineContext.Provider>
  );
};

