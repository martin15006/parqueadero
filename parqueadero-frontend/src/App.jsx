import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Dashboard from "./pages/Dashboard";
import Celador from "./pages/Celador";
import Perfil from "./pages/perfil";
import PerfilUsuario from "./pages/PerfilUsuario";
import MiHistorial from "./pages/MiHistorial";
import Visitantes from "./pages/Visitantes";
import Landing from "./pages/Landing";
import Parqueadero from "./pages/Parqueadero";
import Logs from "./pages/logs";

function RutaProtegida({ children, roles }) {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(usuario.role)) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const [modoClaro, setModoClaro] = useState(() => {
    return localStorage.getItem('tema') === 'claro';
  });

  useEffect(() => {
    if (modoClaro) {
      document.body.classList.add('light-mode');
      localStorage.setItem('tema', 'claro');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('tema', 'oscuro');
    }
  }, [modoClaro]);

  return (
    <BrowserRouter>
      {/* Botón flotante de cambio de tema */}
      <button
        className="theme-toggle"
        onClick={() => setModoClaro(!modoClaro)}
        title={modoClaro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      >
        {modoClaro ? '🌙' : '☀️'}
      </button>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/" element={<Landing />} />
        <Route path="/admin" element={<RutaProtegida roles={['admin']}><Admin /></RutaProtegida>} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/celador" element={<RutaProtegida roles={['admin', 'celador']}><Celador /></RutaProtegida>} />
        <Route path="/perfil" element={<RutaProtegida roles={['admin', 'celador', 'user']}><Perfil /></RutaProtegida>} />
        <Route path="/usuarios/:id/perfil" element={<RutaProtegida roles={['admin']}><PerfilUsuario /></RutaProtegida>} />
        <Route path="/mi-historial" element={<RutaProtegida roles={['admin', 'celador', 'user']}><MiHistorial /></RutaProtegida>} />
        <Route path="/parqueadero" element={<RutaProtegida roles={['admin', 'celador', 'user']}><Parqueadero /></RutaProtegida>} />
        <Route path="/visitantes" element={<RutaProtegida roles={['admin']}><Visitantes /></RutaProtegida>} />
        <Route path="/logs" element={<RutaProtegida roles={['admin']}><Logs /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}