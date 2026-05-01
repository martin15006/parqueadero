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
    const [paginaActual, setPaginaActual] = useState(1);
    const [qrActual, setQrActual] = useState('');
    const [placaActual, setPlacaActual] = useState('');
    const registrosPorPagina = 10;

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
            const resVehiculos = await api.get(`/usuarios/vehiculos${buscarVehiculo ? `?buscar=${buscarVehiculo}` : ''}`);
            setUsuarios(resUsuarios.data);
            setVehiculos(resVehiculos.data);
            setEstadisticas(resEstadisticas.data);
            await cargarHistorial();
        } catch (err) {
            setError('Error al cargar los datos');
        }
    };

    const totalCeladores = usuarios?.filter(u => u.role === 'celador').length || 0;
    const totalAdmins = usuarios?.filter(u => u.role === 'admin').length || 0;

    const indiceUltimoRegistro = paginaActual * registrosPorPagina;
    const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
    const registrosPaginados = historial.slice(indicePrimerRegistro, indiceUltimoRegistro);
    const totalPaginas = Math.ceil(historial.length / registrosPorPagina);

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

    const descargarQR = (url, placa) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_${placa}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                <div className="glyph-divider"><span>ᛟ</span></div>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Panel del Administrador</h1>
                <div className="glyph-divider" style={{ marginBottom: '3rem' }}><span>✦</span></div>

                {error && <div className="alerta alerta-error">{error}</div>}

                {estadisticas && (
                    <>
                        {/* tarjetas de sistema (Manhwa Style) */}
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                            {[
                                { label: 'Adentro ahora', valor: estadisticas.adentro, type: 'success' },
                                { label: 'Entradas hoy', valor: estadisticas.entradasHoy, type: 'info' },
                                { label: 'Salidas hoy', valor: estadisticas.salidasHoy, type: 'danger' },
                                { label: 'Usuarios', valor: estadisticas.totalUsuarios, type: 'warning' },
                                { label: 'Celadores', valor: totalCeladores, type: 'info' },
                                { label: 'Vehículos', valor: estadisticas.totalVehiculos, type: 'info' },
                                { label: 'Admins', valor: totalAdmins, type: 'warning' },
                            ].map((item, i) => (
                                <div key={i} className={`system-panel ${item.type || ''}`}>
                                    <div className="label">{item.label}</div>
                                    <div className="value">{item.valor}</div>
                                </div>
                            ))}
                        </div>

                        {/* exportar el Excel  */}
                        <h3>Historial de entradas y salidas</h3>

                        <div className="top-bar" style={{ display: 'flex', gap: '20px', justifyContent: 'end' }}>
                            <button className="btn btn-export btn-excel" onClick={exportarExcel}>
                                📥 Exportar Excel
                            </button>
                            {/* exportar el pdf  */}
                            <button className="btn btn-export btn-pdf" onClick={exportarPDF}>
                                📄 Exportar PDF
                            </button>
                        </div>


                        {/* grafica */}

                        <div className="card">
                            <h3 style={{ marginBottom: '20px' }}>Entradas ultimos 7 dias</h3>

                            {datosGrafica.length > 0 && (
                                <ResponsiveContainer width='100%' height={250}>
                                    <BarChart data={datosGrafica}>
                                        <CartesianGrid strokeDasharray='3 3' stroke="rgba(201, 168, 76, 0.1)" vertical={false} />
                                        <XAxis dataKey='dia' tick={{ fontSize: 12, fill: 'var(--silver)' }} axisLine={{ stroke: 'var(--gold-dim)' }} />
                                        <YAxis allowDecimals={false} tick={{ fill: 'var(--silver)' }} axisLine={{ stroke: 'var(--gold-dim)' }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'var(--void)', 
                                                border: '1px solid var(--gold)', 
                                                borderRadius: '0',
                                                color: 'var(--text-body)',
                                                fontFamily: 'var(--font-body)'
                                            }}
                                            itemStyle={{ color: 'var(--text-body)' }}
                                            cursor={{ fill: 'rgba(201, 168, 76, 0.05)' }}
                                        />
                                        <Bar dataKey='entrada' fill='#2ecc71' radius={[4, 4, 0, 0]} name="Entradas" />
                                        <Bar dataKey='salida' fill='#e74c3c' radius={[4, 4, 0, 0]} name="Salidas" />
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
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                            <input
                                placeholder="Buscar por nombre, cedula o email"
                                value={buscarUsuario}
                                onChange={e => setBuscarUsuario(e.target.value)}
                                className="input-busqueda"
                            />

                            <button className="btn btn-primary" onClick={cargarDatos}>
                                Buscar
                            </button>
                            <button className="btn btn-warning" onClick={() => {
                                setBuscarUsuario(''); setTimeout(cargarDatos, 100);
                            }} style={{ marginTop: 0 }}>Limpiar</button>
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
                                        <td>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => navigate(`/usuarios/${u.id}/perfil`)}>
                                                <span className="btn-text">Ver perfil</span>
                                                <span className="btn-icon">👁️</span>
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
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                            <input placeholder="Buscar por placa, marca o propietario"
                                value={buscarVehiculo}
                                onChange={e => setBuscarVehiculo(e.target.value)}
                                className="input-busqueda"
                            />
                            <button className="btn btn-primary" onClick={cargarDatos}>
                                Buscar
                            </button>
                            <button className="btn btn-warning" onClick={() => { setBuscarVehiculo(''); setTimeout(cargarDatos, 100); }} style={{ marginTop: 0 }}>
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
                                            <th>QR</th>
                                            <th>Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehiculos.map(v => (
                                            <tr key={v.id}>
                                                <td style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{v.placa?.trim()}</td>
                                                <td>{v.tipo?.trim()}</td>
                                                <td>{v.marca?.trim()}</td>
                                                <td>{v.modelo?.trim()}</td>
                                                <td>{v.color?.trim()}</td>
                                                <td>{v.propietario?.trim()}</td>
                                                <td>{v.email?.trim()}</td>
                                                <td>
                                                     <button className="btn btn-primary btn-sm" onClick={() => {
                                                         setQrActual(v.qr_code);
                                                         setPlacaActual(v.placa);
                                                     }}>
                                                         👁️ Ver QR
                                                     </button>
                                                 </td>
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
                                                        <span className="btn-text">Eliminar</span>
                                                        <span className="btn-icon">🗑️</span>
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
                    <div className="filtros-grid">
                        <input
                            placeholder="Buscar por placa"
                            value={filtros.placa}
                            onChange={e => setFiltros({ ...filtros, placa: e.target.value })}
                            className="input-filtro" />

                        <input
                            placeholder="Buscar por celador"
                            value={filtros.celador || ''}
                            onChange={e => setFiltros({ ...filtros, celador: e.target.value })}
                            className="input-filtro"
                        />

                        <select
                            value={filtros.tipo}
                            onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
                            className="input-filtro">
                            <option value="">Todos los tipos</option>
                            <option value="entrada">Entrada</option>
                            <option value="salida">Salida</option>
                        </select>

                        <input
                            type="date"
                            value={filtros.fecha_inicio}
                            onChange={e => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                            className="input-filtro" />

                        <button className="btn btn-primary" onClick={cargarHistorial} style={{ width: 'auto', marginTop: 0 }}>
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
                                {registrosPaginados.map(r => (
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
                                                <span className="btn-text">Eliminar</span>
                                                <span className="btn-icon">🗑️</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPaginas > 1 && (
                        <div className="paginacion">
                            <button 
                                className="pag-item" 
                                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                disabled={paginaActual === 1}
                            >
                                &laquo;
                            </button>
                            {[...Array(totalPaginas)].map((_, i) => (
                                <button 
                                    key={i} 
                                    className={`pag-item ${paginaActual === i + 1 ? 'active' : ''}`}
                                    onClick={() => setPaginaActual(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button 
                                className="pag-item" 
                                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                                disabled={paginaActual === totalPaginas}
                            >
                                &raquo;
                            </button>
                        </div>
                    )}
                </div>

                {qrActual && (
                    <div className="modal-overlay" onClick={() => setQrActual('')}>
                        <div className="modal-rpg" onClick={e => e.stopPropagation()}>
                            <button className="modal-cerrar" onClick={() => setQrActual('')}>&times;</button>
                            <h3 style={{ marginBottom: '16px', color: 'var(--gold)' }}>Código QR del Vehículo</h3>
                            <div className="glyph-divider"><span>✦</span></div>
                            <div style={{ background: 'white', padding: '10px', display: 'inline-block', borderRadius: '4px' }}>
                                <img src={qrActual} alt="QR code" style={{ width: '200px', height: '200px', display: 'block' }} />
                            </div>
                            <h2 style={{ margin: '16px 0', color: 'var(--gold)', fontFamily: 'var(--font-title)' }}>{placaActual}</h2>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button className="btn btn-success" onClick={() => descargarQR(qrActual, placaActual)}>
                                    📥 Descargar
                                </button>
                                <button className="btn btn-danger" onClick={() => setQrActual('')}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>

    )
}