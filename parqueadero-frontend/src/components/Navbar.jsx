import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/landing');
    };
    return (
        <nav className='navbar'>
            <div>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginRight: '24px' }}>
                    Parqueadero
                </span>
                {usuario.role === 'admin' && <Link to="/admin">Panel admin</Link>}
                {usuario.role === 'celador' && <Link to="/celador">panel celador</Link>}
                <Link to="/dashboard">Inicio</Link>
                <Link to="/perfil">Perfil</Link>
                <Link to={""}>Mapa</Link>
                <Link to="/mi-historial">Mi historial</Link>
                {usuario.role === 'admin' && <Link to='/visitantes'>Visitantes</Link>}
                
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="navbar-usuario">{usuario.nombre}({usuario.role})</span>
                <button onClick={logout} className='btn btn-danger btne-sm'>Salir</button>
            </div>
        </nav>
    );
}