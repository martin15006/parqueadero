import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const [menuAbierto, setMenuAbierto] = useState(false);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/landing');
    };
    return (
        <nav className='navbar' style={{ flexDirection: 'column', padding: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '14px 20px' }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Parqueadero
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'white', fontSize: '0.85rem', opacity: 0.8 }}>
                        {usuario.nombre}
                    </span>
                    {/* boton hamburguesa para el movil  */}
                    <button
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '6px', color: 'white', padding: '4px 10px', cursor: 'pointer', fontSize: '1.2rem' }}>
                        {menuAbierto ? 'X' : '☰'}
                    </button>
                </div>
            </div>

            {/* menu desplegable */}
            {menuAbierto && (
                <div style={{ width: '100%', backgroud: 'rgba(0,0,0,0.3)', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,02' }}>
                    {usuario.role === 'admin' && (
                        <Link to='/admin' onClick={() => setMenuAbierto(false)}
                            style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1' }}>
                            ⚙️ Panel Administrador
                        </Link>
                    )}
                    {usuario.role === 'celador' && (
                        <Link to='/celador' onClick={() => setMenuAbierto(false)}
                            style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1' }}>
                            🔍 Panel Celador
                        </Link>
                    )}
                    <Link to='/dashboard' onClick={() => setMenuAbierto(false)}
                        style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1' }}>
                        🏠 Inicio
                    </Link>
                    <Link to='/perfil' onClick={() => setMenuAbierto(false)}
                        style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1' }}>
                        👤 Perfil
                    </Link>
                    <Link to='/mi-historial' onClick={() => setMenuAbierto(false)}
                        style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1' }}>
                        📋 Mi Historial
                    </Link>
                    {usuario.role === 'admin' && (
                        <Link to='/visitantes' onClick={() => setMenuAbierto(false)}
                            style={{ display: 'block', padding: '12px 20px', color: 'white', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1' }}>
                            🚶 Visitantes
                        </Link>
                    )}
                    <button onClick={logout}
                    style={{display: 'block', width:'100%', textAlign:'left',padding:'12px 20px', background:'#e74c3c', color:'white', border:'none', cursor:'pointer', fontSize:'1rem'}}>
                        Cerrar Sesion
                    </button>
                </div>
            )}
        </nav>
    );
}