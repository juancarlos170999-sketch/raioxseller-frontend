import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    const s = localStorage.getItem('usuario');
    return s ? JSON.parse(s) : null;
  });
  const [mlAuth, setMlAuth] = useState(() => {
    const s = localStorage.getItem('mlAuth');
    return s ? JSON.parse(s) : null;
  });

  const handleLogin = (u) => {
    localStorage.setItem('usuario', JSON.stringify(u));
    setUsuario(u);
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

  if (!usuario) return <Login onLogin={handleLogin} />;
  return <Dashboard usuario={usuario} mlAuth={mlAuth} onMlAuth={handleMlAuth} onLogout={handleLogout} />;
}
