import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../index.css"
import api from '../api/axios';


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('usuario', JSON.stringify(res.data.usuario));

            const role = res.data.usuario.role;
            if (role === 'admin') navigate('/admin');
            else if (role === 'celador') navigate('/celador');
            else navigate('/dashboard');

        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="form-contenedor">
            <div className="form-caja">
                <h2>Parqueadero</h2>
                <p className="form-subtitulo">Inicia sesión para continuar</p>

                {error && <div className="alerta alerta-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grupo">
                        <label>Correo elecctronico</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-grupo">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary">Entrar</button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>
                    ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
                </p>
            </div>
        </div>
    );
}