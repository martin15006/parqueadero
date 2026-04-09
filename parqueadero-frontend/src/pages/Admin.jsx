import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Admin() {
    const [usuarios, setUsuarios] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
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
            const [resUsuarios, resHistorial] = await Promise.all([
                api.get('/usuarios'),
                api.get('/registros'),
            ]);
            setUsuarios(resUsuarios.data);
            setHistorial(resHistorial.data);

            const resVehiculos = await api.get('/usuarios/vehiculos');
            setVehiculos(resVehiculos.data);
        } catch (err) {
            setError('Error al cargar los datos');
        }
    };

    return (
        <>
            <Navbar />
            <div className="pagina">
                <h1>Panel Administrador</h1>

                {error && <div className="alerta alerta-error">{error}</div>}

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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Historial */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Historial de entradas y salidas</h3>
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
    );
}