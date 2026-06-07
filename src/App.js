import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Callback from './pages/Callback';

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    const s = localStorage.getItem('usuario');
    return s ? JSON.parse(s) : null;
  });
  const [mlAuth, setMlAuth] = useState(() => {
    const s = localStorage.getItem('mlAuth');
    return s ? JSON.parse(s) : null;
  });

  const isCallback = window.location.pathname === '/callback';

  const handleLogin = (u) => {
    localStorage.setItem('usuario', JSON.stringify(u));
    setUsuario(u);

    // Verifica se tem código pendente do ML
    const pendingCode = localStorage.getItem('ml_pending_code');
    if (pendingCode) {
      localStorage.removeItem('ml_pending_code');
      import('./api').then(({ ml }) => {
        ml.connect(pendingCode, u.id).then(r => {
          if (r.success) handleMlAuth(r);
        });
      });
    }
  };

  const handleMlAuth = (data) => {
    localStorage.setItem('mlAuth', JSON.stringify(data));
    setMlAuth(data);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUsuario(null);
    setMlAuth(null);
  };

  if (isCallback) {
    return <Callback usuario={usuario} onMlAuth={handleMlAuth} />;
  }

  if (!usuario) return <Login onLogin={handleLogin} />;
  return <Dashboard usuario={usuario} mlAuth={mlAuth} onMlAuth={handleMlAuth} onLogout={handleLogout} />;
}
