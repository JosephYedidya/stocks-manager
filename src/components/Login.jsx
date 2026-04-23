import { useState } from 'react';
import { Button, Input, Select, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import './Login.css';

const { Title, Text } = Typography;

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const handleLogin = () => {
    if (!email || !password) {
      alert('Email et mot de passe requis');
      return;
    }

    // Sauvegarde dans localStorage
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);
    localStorage.setItem('isLoggedIn', 'true');

    // Appelle la fonction onLogin avec le rôle (App.jsx gère l'affichage du dashboard)
    onLogin(email, role);
  };

  return (
    <div className="login-container">
      <Card className="glass-card">
        <div className="login-header">
          <Title level={2} className="welcome-title">
            Welcome
          </Title>
          <Text type="secondary" className="subtitle">
            Connectez-vous pour accéder à votre espace.
          </Text>
        </div>

        <div className="input-group">
          <Text strong className="input-label">
            Email
          </Text>
          <Input
            prefix={<UserOutlined />}
            placeholder="Entrez votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-input"
          />
        </div>

        <div className="input-group">
          <Text strong className="input-label">
            Mot de passe
          </Text>
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Entrez votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-input"
          />
        </div>

        <div className="input-group">
          <Text strong className="input-label">
            Rôle
          </Text>
          <Select
            value={role}
            onChange={setRole}
            className="glass-select"
            options={[
              { label: 'Admin', value: 'Admin' },
              { label: 'Caissière', value: 'Caissière' },
            ]}
          />
        </div>

        <Button
          type="primary"
          block
          size="large"
          icon={<LoginOutlined />}
          onClick={handleLogin}
          className="login-button"
        >
          Login
        </Button>
      </Card>
    </div>
  );
}