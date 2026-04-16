import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../index.css"
import api from '../api/axios';



export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    // const [email, setEmail] = useState('');
    // const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [verPassword, setVerPassword] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', form);
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
                        <input
                            name='email'
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-grupo">
                        <label>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <input name='password'
                                type={verPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                            <span onClick={() => setVerPassword(!verPassword)}
                                style={{ position: 'absolute', right: '12px', top: '45%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.1rem' }}>
                                {verPassword ? '🫣' : '🙈'}
                            </span>
                        </div>
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