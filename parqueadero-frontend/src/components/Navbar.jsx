import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();

    // 🔒 Parse seguro
    let usuario = {};
    try {
        usuario = JSON.parse(localStorage.getItem('usuario')) || {};
    } catch {
        usuario = {};
    }

    const [menuAbierto, setMenuAbierto] = useState(false);
    const [notificacion, setNotificacion] = useState(null);

    // 🔊 Audio optimizado (no se crea cada vez)
    const audioRef = useRef(null);

    const listenerRef = useRef(false);

    useEffect(() => {
        if (listenerRef.current) return; // evita duplicados
        listenerRef.current = true;

        const handleNotif = (e) => {
            setNotificacion(e.detail);

            const sonidos = [
                '/sound1.mp3',
                '/sound2.mp3',
                '/sound3.mp3',
                '/sound4.mp3',
                '/sound5.mp3',
            ];

            const sonidoAleatorio = sonidos[Math.floor(Math.random() * sonidos.length)];

            // detener audio anterior
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            const nuevoAudio = new Audio(sonidoAleatorio);
            nuevoAudio.volume = 0.4;
            nuevoAudio.play().catch(() => { });

            audioRef.current = nuevoAudio;

            setTimeout(() => setNotificacion(null), 5000);
        };

        window.addEventListener('sistema:notificacion', handleNotif);

        return () => {
            window.removeEventListener('sistema:notificacion', handleNotif);
            listenerRef.current = false;
        };
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/landing');
    };

    return (
        <>
            <nav className="navbar navbar-container">

                {/* HEADER */}
                <div className="navbar-top">
                    <span className="navbar-title">
                        Parqueadero
                    </span>

                    <div className="navbar-right">
                        <span className="navbar-usuario">
                            {usuario.nombre}
                        </span>

                        {/* botón hamburguesa */}
                        <button
                            onClick={() => setMenuAbierto(!menuAbierto)}
                            className="navbar-toggle"
                        >
                            {menuAbierto ? '✖' : '☰'}
                        </button>
                    </div>
                </div>

                {/* MENÚ (NO se desmonta → permite animación) */}
                <div className={`navbar-menu ${menuAbierto ? 'open' : ''}`}>

                    {usuario.role === 'admin' && (
                        <Link to='/admin' onClick={() => setMenuAbierto(false)} className="nav-item">
                            ⚙️ Panel Administrador
                        </Link>
                    )}

                    {usuario.role === 'celador' && (
                        <Link to='/celador' onClick={() => setMenuAbierto(false)} className="nav-item">
                            🔍 Panel Celador
                        </Link>
                    )}

                    <Link to='/dashboard' onClick={() => setMenuAbierto(false)} className="nav-item">
                        🏠 Inicio
                    </Link>

                    <Link to='/perfil' onClick={() => setMenuAbierto(false)} className="nav-item">
                        👤 Perfil
                    </Link>

                    <Link to='/mi-historial' onClick={() => setMenuAbierto(false)} className="nav-item">
                        📋 Mi Historial
                    </Link>

                    <Link to='/parqueadero' onClick={() => setMenuAbierto(false)} className="nav-item">
                        🅿️ Parqueadero
                    </Link>

                    {usuario.role === 'admin' && (
                        <Link to='/visitantes' onClick={() => setMenuAbierto(false)} className="nav-item">
                            🚶 Visitantes
                        </Link>
                    )}

                    <button onClick={logout} className="nav-item logout">
                        Cerrar Sesión
                    </button>
                </div>
            </nav>
            {
                notificacion && (
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        background: notificacion.tipo === 'error' ? '#2c0b0b' : '#0b2c1f',
                        color: '#fff',
                        padding: '12px 20px',
                        border: `1px solid ${notificacion.tipo === 'error' ? '#ff4d4d' : '#00ffe0'}`,
                        boxShadow: '0 0 10px rgba(0,255,200,0.5)',
                        zIndex: 9999
                    }}>
                        {notificacion.mensaje}
                    </div>
                )
            }
        </>
    );
}