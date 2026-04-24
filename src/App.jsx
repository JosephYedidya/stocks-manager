import { useState, useEffect } from 'react';
import { AntDesignOutlined } from '@ant-design/icons';
import { Layout, Button, ConfigProvider, theme, message, Space, Badge } from 'antd';
import { DownloadOutlined, WifiOutlined } from '@ant-design/icons';
import { OfflineProvider, useOffline } from './context/OfflineContext.jsx';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import CashierDashboard from './components/CashierDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [appTheme, setAppTheme] = useState('light');
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    if (email && role) {
      setUser({ email, role });
    }

    // PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const themeConfig = {
    token: {
      colorPrimary: '#667eea',
      borderRadius: 8,
    },
    algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  const handleLogin = (email, role) => {
    setUser({ email, role });
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  const handleInstallClick = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      if (outcome === 'accepted') {
        console.log('PWA installed!');
        setInstallPromptEvent(null);
      }
    }
  };

  const PWAStatusBanner = () => {
    const { isOnline, pendingCount, manualSync } = useOffline();

    return (
      <div style={{ 
        position: 'fixed', 
        top: 80,
        right: 20, 
        zIndex: 1001,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        padding: '8px 12px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <Space size="small">
          {installPromptEvent && (
            <Badge count="NEW">
              <Button 
                type="primary" 
                size="small" 
                icon={<DownloadOutlined />} 
                onClick={handleInstallClick}
                title="Install Stocks Manager PWA"
              >
                Install
              </Button>
            </Badge>
          )}
          
          <Badge 
            count={pendingCount > 0 ? pendingCount : 0} 
            size="small"
            offset={[-5, 5]}
          >
            <Button 
              size="small" 
              icon={<WifiOutlined />} 
              type={!isOnline ? 'dashed' : 'text'}
              onClick={manualSync}
              title="Sync Status"
            >
              {!isOnline && 'OFF'}
            </Button>
          </Badge>
        </Space>
      </div>
    );
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <OfflineProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <PWAStatusBanner />
          <Routes>
            <Route
              path="/login"
              element={user ? (
                user.role === 'Admin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/cashier" replace />
                )
              ) : (
                <Login onLogin={handleLogin} />
              )}
            />

            <Route
              path="/admin"
              element={
                user?.role === 'Admin' ? (
                  <Layout style={{ minHeight: '100vh' }}>
                    <AdminHeader
                      user={user}
                      appTheme={appTheme}
                      setAppTheme={setAppTheme}
                      onLogout={handleLogout}
                    />
                    <Layout.Content style={{ padding: '0', background: appTheme === 'light' ? '#f0f2f5' : '#141414' }}>
                      <AdminDashboard darkMode={appTheme === 'dark'} />
                    </Layout.Content>
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/cashier"
              element={
                user?.role === 'Caissière' ? (
                  <Layout style={{ minHeight: '100vh' }}>
                    <CashierHeader
                      user={user}
                      appTheme={appTheme}
                      setAppTheme={setAppTheme}
                      onLogout={handleLogout}
                    />
                    <Layout.Content style={{ padding: '20px', background: appTheme === 'light' ? '#f0f2f5' : '#141414' }}>
                      <CashierDashboard darkMode={appTheme === 'dark'} />
                    </Layout.Content>
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </OfflineProvider>
    </ConfigProvider>
  );
}

// ===== Composant AdminHeader =====
function AdminHeader({ user, appTheme, setAppTheme, onLogout }) {
  return (
    <Layout.Header
      style={{
        background: 'rgb(14,30,172)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        minHeight: '64px'
      }}
    >
      <h1 style={{
        color: 'white',
        margin: 0,
        fontSize: 'clamp(14px, 3vw, 20px)',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        Stocks manager +
      </h1>

      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
      }}>
        <span style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px'
        }}>
          {user.email} - {user.role}
        </span>

        <Button
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'white',
            borderRadius: '4px',
            padding: '4px 8px',
            height: 'auto'
          }}
          onClick={() => setAppTheme(appTheme === 'light' ? 'dark' : 'light')}
        >
          {appTheme === 'light' ? '🌙' : '☀️'}
        </Button>

        <Button
          danger
          style={{
            borderRadius: '4px',
            padding: '4px 8px',
            height: 'auto',
            fontSize: '12px'
          }}
          onClick={onLogout}
        >
          Logout
        </Button>
      </div>
    </Layout.Header>
  );
}

// ===== Composant CashierHeader =====
function CashierHeader({ user, appTheme, setAppTheme, onLogout }) {
  return (
    <Layout.Header
      style={{
        background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        minHeight: '64px'
      }}
    >
      <h1 style={{
        color: 'white',
        margin: 0,
        fontSize: 'clamp(14px, 3vw, 20px)',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        🛍️ Stocks Manager +
      </h1>

      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
      }}>
        <span style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px'
        }}>
          {user.email} - {user.role}
        </span>

        <Button
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'white',
            borderRadius: '4px',
            padding: '4px 8px',
            height: 'auto'
          }}
          onClick={() => setAppTheme(appTheme === 'light' ? 'dark' : 'light')}
        >
          {appTheme === 'light' ? '🌙' : '☀️'}
        </Button>

        <Button
          danger
          style={{
            borderRadius: '4px',
            padding: '4px 8px',
            height: 'auto',
            fontSize: '12px'
          }}
          onClick={onLogout}
        >
          Logout
        </Button>
      </div>
    </Layout.Header>
  );
}// Vercel deploy Wed Apr  8 08:16:51 WAT 2026
