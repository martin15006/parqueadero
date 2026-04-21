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

// protejer las rutas privadas 
function RutaProtegida({ children, roles }) {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(usuario.role)) return <Navigate to="/login" />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/admin" element={<RutaProtegida roles={['admin']}><Admin /></RutaProtegida>} />

        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/celador" element={<RutaProtegida roles={['admin', 'celador']}><Celador /></RutaProtegida>} />

        <Route path="/perfil" element={<RutaProtegida roles={['admin', 'celador', 'user']}><Perfil /></RutaProtegida>} />

        <Route path="/usuarios/:id/perfil" element={<RutaProtegida roles={['admin']}><PerfilUsuario /></RutaProtegida>} />
        <Route path="/mi-historial" element={<RutaProtegida roles={['admin', 'celador', 'user']}><MiHistorial /></RutaProtegida>} />

        <Route path="/visitantes" element={<RutaProtegida roles={['admin']}><Visitantes /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}

