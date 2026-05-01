import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function PerfilUsuario() {
    const { id } = useParams();
    const [perfil, setPerfil] = useState(null);
    const [form, setForm] = useState({
        nombre: '', apellido: '', telefono: '', email: '',
        passwordNueva: '', passwordAdmin: ''
    });
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [editanto, setEditando] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (usuario.role !== 'admin') {
            navigate('/login');
            return;
        }
        cargarPerfil();
    }, []);

    const cargarPerfil = async () => {
        try {
            const res = await api.get(`/usuarios/${id}/perfil`);
            setPerfil(res.data);
            setForm({
                nombre: res.data.nombre || '',
                apellido: res.data.apellido || '',
                telefono: res.data.telefono || '',
                email: res.data.email || '',
                passwordNueva: '',
                passwordAdmin: '',
            });
        } catch {
            setError('Error al cargar perfil');
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
            await api.put(`/usuarios/${id}/perfil`, form);
            setExito('Perfil actializado exitosamente');
            setEditando(false);
            cargarPerfil();
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Errpr añ actualizar');
        }
    };
    if (!perfil) return <><Navbar /><div className='pagina'>Cargando...</div></>;

    return (
        <>
            <Navbar />
            <div className='pagina'>
                <div className="glyph-divider"><span>ᛟ</span></div>
                <h1 style={{ textAlign: 'center', marginBottom: '1rem', textTransform: 'uppercase' }}>
                    Perfil del Usuario (Sistema)
                </h1>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <button className='btn btn-sm' onClick={() => navigate('/admin')}>
                        ⬅ Volver al Panel
                    </button>
                </div>
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
                                <tr><td><strong>Telefono</strong></td><td>{perfil.telefono || '-'}</td></tr>
                                <tr><td><strong>Email</strong></td><td>{perfil.email}</td></tr>
                                <tr><td><strong>Rol</strong></td><td>{perfil.role}</td></tr>
                                <tr><td><strong>Miembro desde</strong></td><td>{new Date(perfil.created_at).toLocaleDateString()}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {editanto && (
                    <div className="modal-overlay" onClick={() => setEditando(false)}>
                        <div className="modal-rpg" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                            <button className="modal-cerrar" onClick={() => setEditando(false)}>&times;</button>
                            <h3 style={{ marginBottom: '20px', color: 'var(--gold)' }}>Editar Perfil del Sistema</h3>
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
                                    <div className='form-grupo'>
                                        <label>Teléfono</label>
                                        <input name='telefono' value={form.telefono} onChange={handleChange} />
                                    </div>
                                    <div className='form-grupo'>
                                        <label>Email</label>
                                        <input name='email' value={form.email} onChange={handleChange} />
                                    </div>
                                    <div className='form-grupo' style={{ gridColumn: '1 / -1' }}>
                                        <label>Nueva Contraseña <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>(Opcional)</span></label>
                                        <input name='passwordNueva' type='password' value={form.passwordNueva} onChange={handleChange} />
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--gold-dim)', marginTop: '20px', paddingTop: '20px', textAlign: 'left' }}>
                                    <h4 style={{ marginBottom: '16px', color: 'var(--crimson-glow)', fontFamily: 'var(--font-heading)' }}>
                                        Verificación de Identidad Admin
                                    </h4>
                                    <div className='form-grupo'>
                                        <label>Tu Contraseña de Administrador <span style={{ color: 'var(--crimson)' }}>*</span></label>
                                        <input
                                            name='passwordAdmin'
                                            type='password'
                                            value={form.passwordAdmin}
                                            onChange={handleChange}
                                            required
                                        />
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