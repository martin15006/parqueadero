import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function Dashboard() {
    const [vehiculos, setVehiculos] = useState([]);
    const [form, setForm] = useState({ placa: '', marca: '', modelo: '', color: '', tipo: 'carro' });
    const [qrActual, setQrActual] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const navigate = useNavigate();
    const [PlacaActual, setPlacaActual] = useState('');
    const esAdmin = JSON.parse(localStorage.getItem('usuario') || '{}').role === 'admin';
    const [vehiculoEditando, setVehiculoEditando] = useState(null);
    const [formEditar, setFormEditar] = useState({ marca: '', modelo: '', color: '', tipo: 'carro' });


    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        cargarVehiculos();
    }, []);

    const cargarVehiculos = async () => {
        try {
            const res = await api.get('/vehiculos/mis-vehiculos');
            setVehiculos(res.data);
        } catch (err) {
            setError('Error al cargar vehiculos');
        }
    };

    const eliminarVehiculo = async (id) => {
        const confirmar = window.confirm('¿seguro que quieres eliminar este vehiculo?');
        if (!confirmar) return;
        try {
            await api.delete(`/vehiculos/${id}`);
            cargarVehiculos();
        } catch (error) {
            setError('Error al eliminar un vehiculo')
        }
    };

    const handlechange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');
        try {
            const res = await api.post('/vehiculos', form);
            setError('');
            setQrActual(res.data.qr_code);
            setExito('vehiculo registrado, Guarda tu QR.');
            setPlacaActual(form.placa);
            setForm({ placa: '', marca: '', modelo: '', color: '', tipo: 'carro' });
            cargarVehiculos();
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al registrar vehiculo');
        }
    };

    const descargarQR = (qrBase64, placa) => {
        const link = document.createElement('a');
        link.href = qrBase64;
        link.download = `QR_${placa}.png`;
        link.click();
    };

    const handleEditar = async (e) => {
        e.preventDefault();
        setError('');
        setExito('');
        try {
            await api.put(`/vehiculos/${vehiculoEditando.id}`, formEditar);
            setExito('Vehiculo actualizado exitosamente');
            setVehiculoEditando(null)
            cargarVehiculos();
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al actualizar');
        }
    };


    return (
        <>
            <Navbar />
            < div className="pagina">
                <h1>Mis vehiculos</h1>

                {error && <div className="alerta alerta-error">{error}</div>}
                {exito && <div className="alerta alerta-exito">{exito}</div>}

                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Registrar nuevo vehiculo</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-grupo">
                                <label>Placa</label>
                                <input name="placa" value={form.placa} onChange={handlechange} required />
                            </div>
                            <div className="form-grupo">
                                <label>marca</label>
                                <input name="marca" value={form.marca} onChange={handlechange} />
                            </div>
                            <div className="form-grupo">
                                <label>modelo</label>
                                <input name="modelo" value={form.modelo} onChange={handlechange} />
                            </div>
                            <div className="form-grupo">
                                <label>color</label>
                                <input name="color" value={form.color} onChange={handlechange} />
                            </div>
                            <div className="form-grupo">
                                <label>Tipo de vehiculo</label>
                                <select name="tipo" value={form.tipo} onChange={handlechange}>
                                    <option value='carro'>Carro</option>
                                    <option value='moto'>Moto</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '18px' }}>
                            Registrar vehiculo
                        </button>
                    </form>
                </div>

                {qrActual && (
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '16px' }}>Tu codigo QR</h3>
                        <p style={{ marginBottom: '16px', color: '#666' }}>
                            Muestra este QR al celador para registrar tu entrada
                        </p>
                        <img src={qrActual} alt="QR code" style={{ width: '200px', height: '200px' }} />
                        <h2 style={{ marginBottom: '16px' }}>{PlacaActual}</h2>
                    </div>
                )}

                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Mis vehiculos registrados</h3>
                    {vehiculos.length === 0 ? (
                        <p style={{ color: '#888' }}>No tienes vehiculos registrados aún.</p>
                    ) : (
                        <div className="tabla-contenedor">
                            <table className="tabla">
                                <thead>
                                    <tr>
                                        <th>Placa</th>
                                        <th>Marca</th>
                                        <th>Modelo</th>
                                        <th>Color</th>
                                        <th>Tipo</th>
                                        <th>QR</th>
                                        <th>Descargar</th>
                                        <th>Editar</th>
                                        {esAdmin && <th>Eliminar</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehiculos.map(v => (
                                        <tr key={v.id}>
                                            <td>{v.placa}</td>
                                            <td>{v.marca}</td>
                                            <td>{v.modelo}</td>
                                            <td>{v.color}</td>
                                            <td>{v.tipo}</td>
                                            <td>
                                                <button className="btn btn-primary btn-sm" onClick={() => {
                                                    setQrActual(v.qr_code);
                                                    setPlacaActual(v.placa);
                                                }}>Ver QR
                                                </button>
                                            </td>
                                            <td>
                                                <button className="btn btn-success btn-sm"
                                                    onClick={() => descargarQR(v.qr_code, v.placa)}>
                                                    Descargar
                                                </button>

                                            </td>
                                            <td>
                                                <button className="btn btn-warning btn-sm" style={{ marginTop: '0' }} onClick={() => {
                                                    setVehiculoEditando(v);
                                                    setFormEditar({ marca: v.marca || '', modelo: v.modelo || '', color: v.color || '', tipo: v.tipo || 'carro' });
                                                }}>Editar</button>
                                            </td>
                                            {esAdmin && (
                                                <td>
                                                    <button className="btn btn-danger btn-sm" onClick={() => { eliminarVehiculo(v.id) }}>Eliminar</button>
                                                </td>)}


                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                {vehiculoEditando && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', }}>
                        <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '440px', maxWidth: '95vw' }}>
                            <h3 style={{ marginBottom: '20px' }}>Editar Vehículo - {vehiculoEditando.placa}</h3>
                            {error && <div className="alerta alerta-error">{error}</div>}
                            <form onSubmit={handleEditar}>
                                <div className="form-grupo">
                                    <label>Marca</label>
                                    <input value={formEditar.marca} onChange={e => setFormEditar({ ...formEditar, marca: e.target.value })} />
                                </div>
                                <div className="form-grupo">
                                    <label>Modelo</label>
                                    <input value={formEditar.modelo} onChange={e => setFormEditar({ ...formEditar, modelo: e.target.value })} />
                                </div>
                                <div className="form-grupo">
                                    <label>Color</label>
                                    <input value={formEditar.color} onChange={e => setFormEditar({ ...formEditar, color: e.target.value })} />
                                </div>
                                <div className="form-grupo">
                                    <label>Tipo</label>
                                    <select value={formEditar.tipo} onChange={e => setFormEditar({ ...formEditar, tipo: e.target.value })}>
                                        <option value="carro">Carro</option>
                                        <option value="moto">Moto</option>
                                    </select>
                                </div>
                                <div style={{ display: "flex", gap: '10px', marginTop: '20px' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
                                    <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => setVehiculoEditando(null)}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )};
            </div>
        </>
    );
}