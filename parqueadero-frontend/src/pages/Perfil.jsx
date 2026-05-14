import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function Perfil() {
    const [perfil, setPerfil] = useState(null);
    const [form, setForm] = useState({
        nombre: '', apellido: '', telefono: '', passwordActual: '', passwordNueva: ''
    });
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [editando, setEditando] = useState(false);
    const navigate = useNavigate();
    const [fortaleza, setFortaleza] = useState({ nivel: 0, tecto: '', color: '' });
    const [verPassword, setVerPassword] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        cargarPerfil();
    }, []);

    const cargarPerfil = async () => {
        try {
            const res = await api.get('/usuarios/perfil');
            setPerfil(res.data);
            setForm({
                nombre: res.data.nombre,
                apellido: res.data.apellido,
                telefono: res.data.telefono,
                passwordActual: '',
                passwordNueva: ''
            });
        } catch {
            setError('Error al cargar el perfil');
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');
        try {
            await api.put('/usuarios/perfil', form);
            setExito('Perfil actualizado exitosamente');
            setEditando(false);
            cargarPerfil();
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al actualizar');
        }
    };

    const evaluarFortaleza = (pass) => {
        let nivel = 0;
        if (pass.length >= 6) nivel++;
        if (/[A-Z]/.test(pass)) nivel++;
        if (/[a-z]/.test(pass)) nivel++;
        if (/\d/.test(pass)) nivel++;
        if (/[^A-za-z0-9]/.test(pass)) nivel++;
        const niveles = [
            { texto: '', color: '#ddd' },
            { texto: 'Muy debil', color: '#e74c3c' },
            { texto: 'Debil', color: '#e67e22' },
            { texto: 'Regular', color: '#f1c40f' },
            { texto: 'Fuerte', color: '#2ecc71' },
            { texto: 'Muy fuerte', color: '#27ae60' },
        ];
        setFortaleza({ nivel, ...niveles[nivel] });
    };

    if (!perfil) return <><Navbar /><div className="pagina">Cargando...</div></>;

    return (
        <>
            <Navbar />
            <div className='pagina'>
                <div className="glyph-divider"><span>ᛟ</span></div>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem', textTransform: 'uppercase' }}>Mi Perfil (Sistema)</h1>
                <div className="glyph-divider" style={{ marginBottom: '3rem' }}><span>✦</span></div>

                {error && <div className='alerta alerta-error'>{error}</div>}
                {exito && <div className='alerta alerta-exito'>{exito}</div>}

                <div className='card'>
                    <div className='top-bar'>
                        <h3>Datos del usuario</h3>
                        <button
                            className='btn btn-primary btn-sm'
                            onClick={() => setEditando(true)}>
                            ⚙️ Editar Perfil
                        </button>
                    </div>

                    <div className="tabla-contenedor">
                        <table className='tabla'>
                            <tbody>
                                <tr><td><strong>Nombre</strong></td><td>{perfil.nombre}</td></tr>
                                <tr><td><strong>Apellido</strong></td><td>{perfil.apellido || '-'}</td></tr>
                                <tr><td><strong>Cedula</strong></td><td>{perfil.cedula || '-'}</td></tr>
                                <tr><td><strong>Telefono</strong></td><td>{perfil.telefono}</td></tr>
                                <tr><td><strong>Email</strong></td><td>{perfil.email}</td></tr>
                                <tr><td><strong>Rol</strong></td><td>{perfil.role}</td></tr>
                                <tr><td><strong>Miembro desde</strong></td><td>{new Date(perfil.created_at).toLocaleDateString()}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {editando && (
                    <div className="modal-overlay" onClick={() => setEditando(false)}>
                        <div className="modal-rpg" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                            <button className="modal-cerrar" onClick={() => setEditando(false)}>&times;</button>
                            <h3 style={{ marginBottom: '20px', color: 'var(--gold)' }}>Editar Perfil Arcano</h3>
                            <div className="glyph-divider"><span>✦</span></div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left' }}>
                                    <div className='form-grupo'>
                                        <label>Nombre</label>
                                        <input name='nombre' value={form.nombre} onChange={handleChange} required />
                                    </div>
                                    <div className='form-grupo'>
                                        <label>Apellido</label>
                                        <input name='apellido' value={form.apellido} onChange={handleChange} />
                                    </div>
                                    <div className='form-grupo' style={{ gridColumn: '1 / -1' }}>
                                        <label>Teléfono</label>
                                        <input name='telefono' value={form.telefono} onChange={handleChange} />
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--gold-dim)', marginTop: '20px', paddingTop: '20px', textAlign: 'left' }}>
                                    <h4 style={{ marginBottom: '16px', color: 'var(--gold-light)', fontFamily: 'var(--font-heading)' }}>Verificación y Contraseña</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className='form-grupo'>
                                            <label>Contraseña Actual</label>
                                            <input name="passwordActual" type='password' value={form.passwordActual} onChange={handleChange} placeholder='Contrasela Actual' required />
                                        </div>

                                        <div className='form-grupo'>
                                            <label>Nueva Contraseña <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>(opcional)</span></label>
                                            <div style={{ position: 'relative' }}>
                                                <input name="passwordNueva" type={verPassword ? 'text' : 'password'}
                                                    value={form.passwordNueva}
                                                    onChange={e => {
                                                        handleChange(e);
                                                        evaluarFortaleza(e.target.value);
                                                    }}
                                                    placeholder="Nueva Contraseña"
                                                />
                                                <span onClick={() => setVerPassword(!verPassword)}
                                                    style={{
                                                        position: 'absolute', right: '12px', top: '50%',
                                                        transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.1rem'
                                                    }}>
                                                    {verPassword ? '🫣' : '🙈'}
                                                </span>
                                            </div>
                                            <small
                                                style={{
                                                    color: 'var(--text-dim)',
                                                    display: 'block',
                                                    marginTop: '6px'
                                                }}
                                            >
                                                Mínimo 6 caracteres, una mayúscula, una minúscula y un número
                                            </small>
                                            {form.passwordNueva && (
                                                <div style={{ marginTop: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                                        {[1, 2, 3, 4, 5].map(n => (
                                                            <div key={n} style={{
                                                                height: '4px', flex: 1, borderRadius: '2px',
                                                                background: n <= fortaleza.nivel ? fortaleza.color : 'rgba(255,255,255,0.1)',
                                                                transition: 'background 0.3s'
                                                            }} />
                                                        ))}
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem', color: fortaleza.color, fontWeight: '600' }}>
                                                        {fortaleza.texto}
                                                    </span>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                                    <button type='submit' className='btn btn-primary' style={{ flex: 1 }}>
                                        Guardar Cambios
                                    </button>
                                    <button type='button' className='btn btn-danger' style={{ flex: 1 }} onClick={() => setEditando(false)}>
                                        Cerrar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
