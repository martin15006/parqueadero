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

    if (!perfil) return <><Navbar /><div className="pagina">Cargando...</div></>;

    return (
        <>
            <Navbar />            
                <div className='pagina'>
                    <h1>Mi Perfil</h1>
                    {error && <div className='alerta alerta-error'>{error}</div>}
                    {exito && <div className='alerta alerta-exito'>{exito}</div>}

                    {/* Datos actuales */}
                    <div className='card'>
                        <div className='top-bar'>
                            <h3>Mis datos</h3>
                            <button
                                className='btn btn-primary btn-sm'
                                onClick={() => setEditando(!editando)}>
                                {editando ? 'Cancelar' : 'Editar'}
                            </button>
                        </div>
                        <div className='tabla-contenedor'>
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

                {/* formulario de edicion  */}
                {editando && (
                    <div className='card'>
                        <h3 style={{ marginBottom: '20px' }}>Editar perfil</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className='form-grupo'>
                                    <label>Nombre</label>
                                    <input name='nombre' value={form.nombre} onChange={handleChange} required />
                                </div>
                                <div className='form-grupo'>
                                    <label>Apellido</label>
                                    <input name='apellido' value={form.apellido} onChange={handleChange} />
                                </div>
                                <div className='form-grupo'>
                                    <label>Telefono</label>
                                    <input name='telefono' value={form.telefono} onChange={handleChange} />
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid #eee', marginTop: '20px', paddingTop: '20px' }}>
                                <h4 style={{ marginBottom: '16px', color: '#555' }}>Veridicacion y cambio de contraseña</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className='form-grupo'>
                                        <label>Contraseña actual<span style={{ color: 'red' }}>*</span></label>
                                        <input name="passwordActual" type='password' value={form.passwordActual} onChange={handleChange} required />
                                    </div>

                                    <div className='form-grupo'>
                                        <label>Nueva contraseña<span style={{ color: '#888', fontSize: '0.85rem' }}>(opcional)</span></label>
                                        <input name="passwordNueva" type='password' value={form.passwordNueva} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <button type='submit' className='btn btn-primary' style={{ marginTop: '16px' }}>
                                Guardar cambios
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
}