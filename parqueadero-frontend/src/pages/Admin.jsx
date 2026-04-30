import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

export default function Admin() {
    const [usuarios, setUsuarios] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [filtros, setFiltros] = useState({ placa: '', tipo: '', fecha_inicio: '', fecha_fin: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [buscarUsuario, setBuscarUsuario] = useState('');
    const [buscarVehiculo, setBuscarVehiculo] = useState('');

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
            const resUsuarios = await api.get(`/usuarios${buscarUsuario ? `?buscar=${buscarUsuario}` : ''}`);
            const resVehiculos = await api.get(`/usuarios/vehiculos${buscarVehiculo ? `?buscar={buscarVehiculo}` : ''}`);
            setUsuarios(resUsuarios.data);
            setVehiculos(resVehiculos.data);
            setEstadisticas(resEstadisticas.data);
            await cargarHistorial();
        } catch (err) {
            setError('Error al cargar los datos');
        }
    };

    const totalCeladores = usuarios?.filter(u => u.role === 'celador').length || 0;

    const datosGrafica = (estadisticas?.porDia ?? []).map(item => ({
        dia: new Date(item.dia).toLocaleDateString(),
        entrada: Number(item.entrada || 0),
        salida: Number(item.salida || 0)
    }));

    const cargarHistorial = async () => {
        try {
            const params = new URLSearchParams();
            if (filtros.placa) params.append('placa', filtros.placa);
            if (filtros.tipo) params.append('tipo', filtros.tipo);
            if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
            if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
            if (filtros.celador) params.append('celador', filtros.celador);

            const res = await api.get(`/registros?${params.toString()}`);
            setHistorial(res.data);
        } catch (err) {
            setError('Error al cargar historial');
        }
    };

    const exportarExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Historial');

        worksheet.columns = [
            { header: 'Tipo', key: 'tipo', width: 15 },
            { header: 'Placa', key: 'placa', width: 15 },
            { header: 'Marca', key: 'marca', width: 15 },
            { header: 'Modelo', key: 'modelo', width: 15 },
            { header: 'Propietario', key: 'propietario', width: 15 },
            { header: 'celador', key: 'celador', width: 15 },
            { header: 'Fecha', key: 'fecha', width: 17 }
        ];

        historial.forEach(r => {
            worksheet.addRow({
                tipo: r.tipo_registro,
                placa: r.placa,
                marca: r.marca,
                modelo: r.modelo,
                propietario: r.propietario,
                celador: r.celador || '-',
                fecha: new Date(r.fecha)
            });
        });

        // estilos de encabezado 
        worksheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFbfbfbf' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // bordes para todas las celdas 
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };

                // filas alternadas 
                if (rowNumber > 1 && rowNumber % 2 === 0) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' }
                    };
                }
            });
        });

        // Alineacion de columnas 
        ['tipo', 'placa', 'marca', 'modelo'].forEach(col => {
            worksheet.getColumn(col).alignment = { horizontal: 'center' };
        });

        // Formato de fecha
        worksheet.getColumn('fecha').numFmt = 'dd/mm/yyyy hh:mm';

        // filtro tipo excel 
        worksheet.autoFilter = {
            from: 'A1',
            to: 'G1'
        };

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `historial_parqueadero.xlsx`);
    };

    const exportarPDF = () => {
        const doc = new jsPDF();

        // Titulo 
        doc.setFontSize(18);
        doc.setTextColor(31, 78, 128);
        doc.text('Sistema de Parqueader', 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Historial de entradas y salidas', 14, 30);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 37);

        // Tabla 
        autoTable(doc, {
            startY: 45,
            head: [['Tipo', 'Placa', 'Marca', 'Modelo', 'Propietario', 'Celador', 'Fecha']],
            body: historial.map(r => [
                r.tipo_registro === 'entrada' ? 'Entrada' : 'Salida',
                r.placa || '-',
                r.marca || '-',
                r.modelo || '-',
                r.propietario || '-',
                r.celador || '-',
                new Date(r.fecha).toLocaleString()
            ]),
            headStyles: { fillColor: [31, 78, 138], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            styles: { fontSize: 9, font: 'helvetica' },
        });

        doc.save(`historial_parqueadero_${new Date().toLocaleDateString()}.pdf`);
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
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            {[
                                { label: '🚗 Adentro ahora', valor: estadisticas.adentro, color: '#2ecc71' },
                                { label: '🟢 Entradas hoy', valor: estadisticas.entradasHoy, color: '#4361ee' },
                                { label: '🔴 Salidas hoy', valor: estadisticas.salidasHoy, color: '#e74c3c' },
                                { label: '👥 Usuarios', valor: estadisticas.totalUsuarios, color: '#f39c12' },
                                { label: '💂 Celadores', valor: totalCeladores, color: '#3498db' },
                                { label: '🚙 Vehiculos', valor: estadisticas.totalVehiculos, color: '#9b59b6' },
                            ].map((item, i) => (
                                <div key={i} className="card" style={{ textAlign: 'center', borderTop: `4px solid ${item.color}` }}>
                                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>{item.label}</p>
                                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: item.color }}>{item.valor}</p>
                                </div>
                            ))}
                        </div>

                        {/* exportar el Excel  */}
                        <h3>Historial de entradas y salidas</h3>

                        <div className="top-bar" style={{ display: 'flex', gap: '20px', justifyContent: 'end' }}>
                            <button className="btn btn-success" onClick={exportarExcel}>
                                📥 Exportar Excel
                            </button>
                            {/* exportar el pdf  */}
                            <button className="btn btn-danger" onClick={exportarPDF}>
                                📄 Exportar PDF
                            </button>
                        </div>


                        {/* grafica */}

                        <div className="card">
                            <h3 style={{ marginBottom: '20px' }}>Entradas ultimos 7 dias</h3>

                            {datosGrafica.length > 0 && (
                                <ResponsiveContainer width='100%' height={250}>
                                    <BarChart data={datosGrafica}>
                                        <CartesianGrid strokeDasharray='3 3' />
                                        <XAxis dataKey='dia' tick={{ fontSize: 12 }} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey='entrada' fill='#2ecc71' radius={[20, 20, 0, 0]} />
                                        <Bar dataKey='salida' fill='#e74c3c' radius={[20, 20, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </>
                )}

                {/* Usuarios */}
                <div className="card">


                    <h3>Usuarios registrados</h3>
                    <div className="top-bar">
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                                placeholder="Buscar por nombre, cedula o email"
                                value={buscarUsuario}
                                onChange={e => setBuscarUsuario(e.target.value)}
                                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', minWidth: '250px' }}
                            />

                            <button className="btn btn-primary" onClick={cargarDatos} style={{ width: 'auto' }}>
                                Buscar
                            </button>
                            <button className="btn btn-warning" onClick={() => {
                                setBuscarUsuario(''); setTimeout(cargarDatos, 100);
                            }} style={{ width: 'auto' }}>Limpiar</button>
                        </div>
                    </div>

                    {/* tabla usuarios  */}
                    <div className="tabla-contenedor">

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
                </div>
                
                <div className="card">
                    <div className="top-bar">
                        <h3>Todos los vehículos</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder="Buscar por placa, marca o propietario"
                                value={buscarVehiculo}
                                onChange={e => setBuscarVehiculo(e.target.value)}
                                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', minWidth: '250px' }}
                            />
                            <button className="btn btn-primary" onClick={cargarDatos} style={{ width: 'auto' }}>
                                Buscar
                            </button>
                            <button className="btn btn-warning" onClick={() => { setBuscarVehiculo(''); setTimeout(cargarDatos, 100); }} style={{ width: 'auto' }}>
                                Limpiar
                            </button>
                        </div>
                    </div>
                    {/* Tabla Vehículos */}
                    <div className="tabla-contenedor">
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

                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Historial de entradas y salidas</h3>

                    {/* filtros  */}
                    <div className="filtros-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', marginBottom: '20px' }}>
                        <input
                            placeholder="Buscar por placa"
                            value={filtros.placa}
                            onChange={e => setFiltros({ ...filtros, placa: e.target.value })}
                            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }} />

                        <input
                            placeholder="Buscar por celador"
                            value={filtros.celador || ''}
                            onChange={e => setFiltros({ ...filtros, celador: e.target.value })}
                            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }}
                        />

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

                    <div className="tabla-contenedor">
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
                </div>



            </div>
        </>

    )
}