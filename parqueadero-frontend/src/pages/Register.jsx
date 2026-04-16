import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
    const [form, setForm] = useState({ nombre: '', apellido: '', cedula: '', telefono: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const navigate = useNavigate();
    const [fortaleza, setFortaleza] = useState({ nivel: 0, texto: '', color: '' });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (e.target.name === 'password') evaluarFortaleza(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/register', form);
            setExito('Registro exitoso. Redirigiendo...');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al registrarse');
        }
    };

    const evaluarFortaleza = (pass) => {
        let nivel = 0;
        if (pass.length >= 6) nivel++;
        if (/[A-Z]/.test(pass)) nivel++;
        if (/[a-z]/.test(pass)) nivel++;
        if (/\d/.test(pass)) nivel++;
        if (/[^A-Za-z0-9]/.test(pass)) nivel++;

        const niveles = [
            { texto: '', color: '#ddd' },
            { texto: 'Muy débil', color: '#e74c3c' },
            { texto: 'Débil', color: '#e67e22' },
            { texto: 'Regular', color: '#f1c40f' },
            { texto: 'Fuerte', color: '#2ecc71' },
            { texte: 'Muy fuerte', color: '#27ae60' }
        ];
        setFortaleza({ nivel, ...niveles[nivel] });
    };

    return (
        <div className='form-contenedor'>
            <div className='form-caja'>
                <h2>Crear Cuenta</h2>
                <p className='form-subtitulo'>Registrate para acceder al sistema</p>
                {error && <div className="alerta alerta-error">{error}</div>}
                {exito && <div className='alerta alerta-exito'>{exito}</div>}

                < form onSubmit={handleSubmit}>
                    <div className='form-grupo'>
                        <label>Nombre</label>
                        <input name="nombre" value={form.nombre} onChange={handleChange} required />
                    </div>
                    <div className='form-grupo'>
                        <label>Apellido</label>
                        <input name='apellido' value={form.apellido} onChange={handleChange} required />
                    </div>
                    <div className='form-grupo'>
                        <label>Cedula</label>
                        <input name="cedula" value={form.cedula} onChange={handleChange} required />
                    </div>
                    <div className='form-grupo'>
                        <label>Telefono</label>
                        <input name='telefono' value={form.telefono} onChange={handleChange} required />
                    </div>
                    <div className='form-grupo'>
                        <label>Correo electronico</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className='form-grupo'>
                        <label>Contraseña</label>
                        <input name='password' type='password' value={form.password} onChange={handleChange} required />
                    </div>
                    <button type='submit' className='btn btn-primary'>Registrarse</button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>
                    ¿Ya tienes una cuenta? <Link to="/login">Inicia sesion</Link>
                </p>
            </div>
        </div>
    );
}