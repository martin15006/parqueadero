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
            <div className='pagna'>
                <div className='top-bar'>
                    <h1 style={{marginTop: '20px'}}>Perfil de {perfil.nombre} {perfil.apellido}</h1>
                    <button className='btn btn-warning' onClick={() => navigate('/admin')}>
                        volver al panel
                    </button>
                </div>

                {error && <div className='alerta alerta-error'>{error}</div>}
                {exito && <div className='alerta alerta-exito'>{exito}</div>}

                <div className='card'>
                    <div className='top-bar'>
                        <h3>Datos del usuario</h3>
                        <button
                            className='btn btn-primary btn-sm'
                            onClick={() => setEditando(!editanto)}>
                            {editanto ? 'Cancelar' : 'Editar'}
                        </button>
                    </div>

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

                {editanto && (
                    <div className='card'>
                        <h3 style={{ marginBottom: '20px' }}>Editar perfil</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', grinTemplateColums: '1fr 1fr', gap: '16px' }}>
                                <div className='form-grupo'>
                                    <label>Nombre</label>
                                    <input name='nombre' value={form.nombre} onChange={handleChange}></input>
                                </div>
                                <div className='form-grupo'>
                                    <label>Apellido</label>
                                    <input name='apellido' value={form.apellido} onChange={handleChange}></input>
                                </div>
                                <div className='form-grupo'>
                                    <label>Telefono</label>
                                    <input name='telefono' value={form.telefono} onChange={handleChange}></input>
                                </div>
                                <div className='form-grupo'>
                                    <label>Email</label>
                                    <input name='email' value={form.email} onChange={handleChange}></input>
                                </div>
                                <div className='form-grupo'>
                                    <label>Nueva contraseña <span style={{ color: '#888', fontSize: '0.85rem' }}>(opcional)</span></label>
                                    <input name='passwordNueva' type='password' value={form.passwordNueva} onChange={handleChange}></input>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid #eee', marginTop: '20px', paddingTop: '20px' }}>
                                <h4 style={{ marginBottom: '16px', color: '#e74c3c' }}>
                                    Confirmar tu identidad como administrador
                                </h4>
                                <div className='form-grupo' style={{ maxWidth: '400px' }}>
                                    <label>Tu contraseña de administrador <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        name='passwordAdmin'
                                        type='password'
                                        value={form.passwordAdmin}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <button type='submit' className='btn btn-primary btn-sm' style={{ marginTop: '16px', height: '3.5em' }}>
                                Guardar cambios
                            </button>
                        </form>
                    </div>

                )}

            </div>
        </>
    );
}