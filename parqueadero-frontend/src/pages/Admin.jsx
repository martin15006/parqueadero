import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function Admin() {
    const [usuarios, setUsuarios] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [filtros, setFiltros] = useState({ placa: '', tipo: '', fecha_inicio: '', fecha_fin: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (usuario.role !== 'admin') {
            navigate('/login');
            return;
        }
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const resEstadisticas = await api.get('/registros/estadisticas');
            const [resUsuarios, resVehiculos] = await Promise.all([
                api.get('/usuarios'),
                api.get('/usuarios/vehiculos'),
            ]);
            setUsuarios(resUsuarios.data);
            setVehiculos(resVehiculos.data);
            setEstadisticas(resEstadisticas.data);
            await cargarHistorial();
        } catch (err) {
            setError('Error al cargar los datos');
        }
    };

    const cargarHistorial = async () => {
        try {
            const params = new URLSearchParams();
            if (filtros.placa) params.append('placa', filtros.placa);
            if (filtros.tipo) params.append('tipo', filtros.tipo);
            if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
            if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);

            const res = await api.get(`/registros?${params.toString()}`);
            setHistorial(res.data);
        } catch (err) {
            setError('Error al cargar historial');
        }
    };

    const exportarExcel = () => {
        const datos = historial.map(r => ({
            'Tipo': r.tipo_registro,
            'Placa': r.placa,
            'Marca': r.marca,
            'Propietario': r.propietario,
            'Celador': r.celador || '-',
            'Fecha': new Date(r.fecha).toLocaleString()
        }));

        const hoja = XLSX.utils.json_to_sheet(datos);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Historial');
        const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        saveAs(blob, `historial_parqueadero_${new Date().toLocaleDateString()}.xlsx`);
    };

    return (


        <>
            <Navbar />
            <div className="pagina">
                <h1>Panel Administrador</h1>

                {error && <div className="alerta alerta-error">{error}</div>}

                {estadisticas && (
                    <>
                        {/* tarjetas  */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            {[
                                { label: '🚗 Adentro ahora', valor: estadisticas.adentro, color: '#2ecc71' },
                                { label: '🟢 Entradas hoy', valor: estadisticas.entradasHoy, color: '#4361ee' },
                                { label: '🔴 Salidas hoy', valor: estadisticas.salidasHoy, color: '#e74c3c' },
                                { label: '👥 Usuarios', valor: estadisticas.totalUsuarios, color: '#f39c12' },
                                { label: '🚙 Vehiculos', valor: estadisticas.totalVehiculos, color: '#9b59b6' },
                            ].map((item, i) => (
                                <div key={i} className="card" style={{ textAlign: 'center', borderTop: `4px solid ${item.color}` }}>
                                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>{item.label}</p>
                                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: item.color }}>{item.valor}</p>
                                </div>
                            ))}
                        </div>

                        {/* exportar el Excel  */}
                        <div className="top-bar">
                            <h3>Historial de entradas y salidas</h3>
                            <button className="btn btn-success" onClick={exportarExcel}>
                                📥 Exportar Excel
                            </button>
                        </div>

                        {/* grafica */}

                        <div className="card">
                            <h3 style={{ marginBottom: '20px' }}>Entradas ultimos 7 dias</h3>
                            <ResponsiveContainer width='100%' height={250}>
                                <BarChart data={estadisticas.porDia}>
                                    <CartesianGrid strokeDasharray='3 3' />
                                    <XAxis dataKey='dia' />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey='total' fill='#4361ee' radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {/* Usuarios */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Usuarios registrados</h3>
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Fecha registro</th>
                                <th>Cambiar Rol</th>
                                <th>Perfil</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(u => (
                                <tr key={u.id}>
                                    <td>{u.nombre?.trim()}</td>
                                    <td>{u.email?.trim()}</td>
                                    <td>{u.role}</td>
                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <select
                                            value={u.role}
                                            onChange={async (e) => {
                                                try {
                                                    await api.put(`/usuarios/${u.id}/rol`, { role: e.target.value });
                                                    cargarDatos();
                                                } catch {
                                                    alert('Error al cambiar rol');
                                                }
                                            }}
                                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        >
                                            <option value="user">User</option>
                                            <option value="celador">Celador</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td><button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => navigate(`/usuarios/${u.id}/perfil`)}>
                                        Ver perfil
                                    </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Historial de entradas y salidas</h3>

                    {/* filtros  */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', marginBottom: '20px' }}>
                        <input
                            placeholder="Buscar por placa"
                            value={filtros.placa}
                            onChange={e => setFiltros({ ...filtros, placa: e.target.value })}
                            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }} />

                        <select
                            value={filtros.tipo}
                            onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
                            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <option value="">Todos los tipos</option>
                            <option value="entrada">Entrada</option>
                            <option value="salida">Salida</option>
                        </select>

                        <input
                            type="date"
                            value={filtros.fecha_inicio}
                            onChange={e => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: ' 8px' }} />

                        <button className="btn btn-primary" onClick={cargarHistorial} style={{ width: 'auto' }}>
                            Filtrar
                        </button>
                    </div>

                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Placa</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Propietario</th>
                                <th>Celador</th>
                                <th>Fecha</th>
                                <th>Eliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.map(r => (
                                <tr key={r.id}>
                                    <td>
                                        {r.tipo_registro?.trim().toLowerCase() === 'entrada'
                                            ? '🟢 Entrada'
                                            : '🔴 Salida'}
                                    </td>
                                    <td>{r.placa?.trim()}</td>
                                    <td>{r.marca?.trim()}</td>
                                    <td>{r.modelo?.trim()}</td>
                                    <td>{r.propietario?.trim()}</td>
                                    <td>{r.celador?.trim() || '-'}</td>
                                    <td>{new Date(r.fecha).toLocaleString()}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={async () => {
                                                if (window.confirm('¿Eliminar este registro del historial?')) {
                                                    try {
                                                        await api.delete(`/registros/${r.id}`);
                                                        cargarDatos();
                                                    } catch {
                                                        alert('Error al eliminar');
                                                    }
                                                }
                                            }}>
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>



                {/* Vehículos */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Todos los vehículos</h3>
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Placa</th>
                                <th>Tipo</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Color</th>
                                <th>Propietario</th>
                                <th>Email</th>
                                <th>Eliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehiculos.map(v => (
                                <tr key={v.id}>
                                    <td>{v.placa?.trim()}</td>
                                    <td>{v.tipo?.trim()}</td>
                                    <td>{v.marca?.trim()}</td>
                                    <td>{v.modelo?.trim()}</td>
                                    <td>{v.color?.trim()}</td>
                                    <td>{v.nombre?.trim()}</td>
                                    <td>{v.email?.trim()}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={async () => {
                                                if (window.confirm(`¿Eliminar vehículo ${v.placa}?`)) {
                                                    try {
                                                        await api.delete(`/vehiculos/${v.id}`);
                                                        cargarDatos();
                                                    } catch {
                                                        alert('Error al eliminar');
                                                    }
                                                }
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>

    )
}