import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from 'recharts';

// ─── Constantes ──

const TIPO_COLORES = {
    info: { bg: 'rgba(67,97,238,0.15)', color: '#4361ee', label: 'ℹ️ Info' },
    exito: { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71', label: '✅ Éxito' },
    error: { bg: 'rgba(231,76,60,0.15)', color: '#e74c3c', label: '❌ Error' },
    critico: { bg: 'rgba(139,0,0,0.25)', color: '#ff2200', label: '🔴 Crítico' },
};

const FILTROS_INICIALES = {
    accion: '',
    tipo: '',
    usuario: '',
    fecha_inicio: '',
    fecha_fin: '',
};

const STATS_CONFIG = [
    { key: 'totalHoy', label: 'Logs hoy', type: 'info' },
    { key: 'loginsExitosos', label: 'Logins exitosos', type: 'success' },
    { key: 'loginsFallidos', label: 'Logins fallidos', type: 'danger' },
    { key: 'accionesCriticas', label: 'Acciones críticas', type: 'danger' },
    { key: 'errores', label: 'Errores', type: 'warning' },
];

// total de registro que quiere que muestre por pagina 
const LOGS_POR_PAGINA = 15;

// ─── Utilidades ──

const parseSafe = (data) => {
    try {
        if (!data) return null;
        if (typeof data === 'object') return data;
        return JSON.parse(data);
    } catch {
        return typeof data === 'string' ? data : null;
    }
};

const formatearDatoLegible = (data) => {
    const parsed = parseSafe(data);
    if (!parsed || typeof parsed !== 'object') return null;

    const etiquetas = {
        nombre: 'Nombre',
        apellido: 'Apellido',
        email: 'Correo',
        placa: 'Placa',
        marca: 'Marca',
        modelo: 'Modelo',
        color: 'Color',
        tipo: 'Tipo',
        usuario_id: 'ID Usuario',
        nuevo_rol: 'Nuevo Rol',
    };

    return Object.entries(parsed)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${etiquetas[k] || k}: ${v}`)
        .join('\n');
};

const buildParams = (filtros) => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
    });
    return params;
};

const fechaHoy = () => new Date().toLocaleDateString('es-CO');

// ─── Componente principal ──

export default function Logs() {
    const [logs, setLogs] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    const [logDetalle, setLogDetalle] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const navigate = useNavigate();

    // ── Paginación (derivada, no en estado) ──
    const totalPaginas = Math.ceil(logs.length / LOGS_POR_PAGINA);
    const logsPaginados = logs.slice(
        (paginaActual - 1) * LOGS_POR_PAGINA,
        paginaActual * LOGS_POR_PAGINA
    );

    // ── Seguridad: solo admins ──
    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (usuario.role !== 'admin') {
            navigate('/login');
            return;
        }
        cargarTodo();
    }, []);

    // ── Carga inicial ──
    const cargarTodo = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const [resLogs, resStats] = await Promise.all([
                api.get('/logs'),
                api.get('/logs/estadisticas'),
            ]);
            setLogs(resLogs.data);
            setEstadisticas(resStats.data);
            setPaginaActual(1);
        } catch (err) {
            console.error('[Logs] cargarTodo:', err);
            setError('Error al cargar los logs. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    }, []);

    // ── Filtrado ──
    const filtrar = async () => {
        setCargando(true);
        setError('');
        setPaginaActual(1);
        try {
            const res = await api.get(`/logs?${buildParams(filtros).toString()}`);
            setLogs(res.data);
        } catch (err) {
            console.error('[Logs] filtrar:', err);
            setError('Error al aplicar los filtros.');
        } finally {
            setCargando(false);
        }
    };

    const limpiarFiltros = () => {
        setFiltros(FILTROS_INICIALES);
        setPaginaActual(1);
        cargarTodo();
    };

    const setFiltro = (campo, valor) =>
        setFiltros(prev => ({ ...prev, [campo]: valor }));

    // ── Exportar PDF ──
    const exportarPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor(139, 0, 0);
        doc.text('Logs de Auditoría', 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 30);
        doc.text(`Total registros: ${logs.length}`, 14, 37);

        autoTable(doc, {
            startY: 45,
            head: [['Fecha', 'Usuario', 'Rol', 'Acción', 'Descripción', 'IP', 'Tipo']],
            body: logs.map(l => [
                new Date(l.fecha).toLocaleString('es-CO'),
                l.usuario_nombre || '—',
                l.usuario_role || '—',
                l.accion,
                l.descripcion,
                l.ip || '—',
                l.tipo.toUpperCase(),
            ]),
            headStyles: { fillColor: [139, 0, 0], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            styles: { fontSize: 7, font: 'helvetica' },
        });

        doc.save(`logs_auditoria_${fechaHoy()}.pdf`);
    };

    // ── Exportar Excel ──
    const exportarExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Logs');

        sheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 22 },
            { header: 'Usuario', key: 'usuario', width: 20 },
            { header: 'Rol', key: 'rol', width: 12 },
            { header: 'Acción', key: 'accion', width: 25 },
            { header: 'Descripción', key: 'descripcion', width: 40 },
            { header: 'IP', key: 'ip', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 12 },
        ];

        logs.forEach(l => {
            sheet.addRow({
                fecha: new Date(l.fecha).toLocaleString('es-CO'),
                usuario: l.usuario_nombre || '—',
                rol: l.usuario_role || '—',
                accion: l.accion,
                descripcion: l.descripcion,
                ip: l.ip || '—',
                tipo: l.tipo.toUpperCase(),
            });
        });

        sheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B0000' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        sheet.autoFilter = { from: 'A1', to: 'G1' };

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `logs_auditoria_${fechaHoy()}.xlsx`);
    };

    // ── Datos gráfica ──
    const datosGrafica = (estadisticas?.porDia ?? []).map(item => ({
        dia: new Date(item.dia).toLocaleDateString('es-CO'),
        total: Number(item.total),
    }));

    // ── Páginas a mostrar (con ellipsis para muchas páginas) ───────────────
    const paginasVisibles = Array.from({ length: totalPaginas }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 2)
        .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);


    // RENDER

    return (
        <>
            <Navbar />

            <div className="pagina">

                {/* Encabezado */}
                <div className="glyph-divider"><span>ᛟ</span></div>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Logs de Auditoría</h1>
                <div className="glyph-divider" style={{ marginBottom: '3rem' }}><span>✦</span></div>

                {/* Error global */}
                {error && (
                    <div className="alerta alerta-error" role="alert">{error}</div>
                )}

                {/* Indicador de carga */}
                {cargando && (
                    <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                        Cargando…
                    </p>
                )}

                {/* ── Modal detalle ── */}
                {logDetalle && (
                    <div
                        className="modal-overlay"
                        onClick={() => setLogDetalle(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Detalle del log"
                    >
                        <div
                            className="modal-rpg"
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '620px', textAlign: 'left' }}
                        >
                            <button
                                className="modal-cerrar"
                                onClick={() => setLogDetalle(null)}
                                aria-label="Cerrar"
                            >
                                &times;
                            </button>

                            <h3 style={{ color: 'var(--gold)', marginBottom: '12px' }}>
                                Detalle del Log
                            </h3>
                            <div className="glyph-divider"><span>✦</span></div>

                            <table className="tabla" style={{ marginTop: '16px' }}>
                                <tbody>
                                    <tr><td><strong>Fecha</strong></td>       <td>{new Date(logDetalle.fecha).toLocaleString('es-CO')}</td></tr>
                                    <tr><td><strong>Usuario</strong></td>     <td>{logDetalle.usuario_nombre || '—'}</td></tr>
                                    <tr><td><strong>Rol</strong></td>         <td>{logDetalle.usuario_role || '—'}</td></tr>
                                    <tr><td><strong>Acción</strong></td>      <td>{logDetalle.accion}</td></tr>
                                    <tr><td><strong>Descripción</strong></td> <td>{logDetalle.descripcion}</td></tr>
                                    <tr><td><strong>IP</strong></td>          <td>{logDetalle.ip || '—'}</td></tr>
                                    <tr><td><strong>Tipo</strong></td>        <td>{logDetalle.tipo}</td></tr>

                                    {formatearDatoLegible(logDetalle.datos_anteriores) && (
                                        <tr>
                                            <td><strong>Antes</strong></td>
                                            <td>
                                                <div style={{
                                                    background: 'rgba(139,0,0,0.1)',
                                                    border: '1px solid rgba(139,0,0,0.3)',
                                                    padding: '10px 14px',
                                                    fontSize: '1.1rem',
                                                    lineHeight: '1.8',
                                                    whiteSpace: 'pre-line'
                                                }}>
                                                    {formatearDatoLegible(logDetalle.datos_anteriores)}
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {formatearDatoLegible(logDetalle.datos_nuevos) && (
                                        <tr>
                                            <td><strong>Después</strong></td>
                                            <td>
                                                <div style={{
                                                    background: 'rgba(46,100,60,0.1)',
                                                    border: '1px solid rgba(46,100,60,0.3)',
                                                    padding: '10px 14px',
                                                    fontSize: '1.1rem',
                                                    lineHeight: '1.8',
                                                    whiteSpace: 'pre-line'
                                                }}>
                                                    {formatearDatoLegible(logDetalle.datos_nuevos)}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Estadísticas ───────────────────────────────────────── */}
                {estadisticas && (
                    <>
                        <div
                            className="stats-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '16px',
                                marginBottom: '24px',
                            }}
                        >
                            {STATS_CONFIG.map(({ key, label, type }) => (
                                <div key={key} className={`system-panel ${type}`}>
                                    <div className="label">{label}</div>
                                    <div className="value">{estadisticas[key] ?? 0}</div>
                                </div>
                            ))}
                        </div>

                        {datosGrafica.length > 0 && (
                            <div className="card">
                                <h3 style={{ marginBottom: '20px' }}>Actividad últimos 7 días</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={datosGrafica}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,0,0,0.15)" vertical={false} />
                                        <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'var(--silver)' }} />
                                        <YAxis allowDecimals={false} tick={{ fill: 'var(--silver)' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--void)',
                                                border: '1px solid var(--gold)',
                                                color: 'var(--text-body)',
                                            }}
                                        />
                                        <Bar dataKey="total" fill="#cc2200" radius={[4, 4, 0, 0]} name="Logs" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </>
                )}

                {/* ── Filtros + tabla ────────────────────────────────────── */}
                <div className="card">
                    <div className="top-bar">
                        <h3>Registros de Auditoría</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-export btn-excel" onClick={exportarExcel}>📥 Excel</button>
                            <button className="btn btn-export btn-pdf" onClick={exportarPDF}>📄 PDF</button>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div
                        className="filtros-grid"
                        style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'center' }}
                    >
                        <input
                            placeholder="Buscar acción"
                            value={filtros.accion}
                            onChange={e => setFiltro('accion', e.target.value)}
                            className="input-filtro"
                            style={{ flex: '1 1 160px', minWidth: '140px' }}
                        />
                        <input
                            placeholder="Buscar usuario"
                            value={filtros.usuario}
                            onChange={e => setFiltro('usuario', e.target.value)}
                            className="input-filtro"
                            style={{ flex: '1 1 160px', minWidth: '140px' }}
                        />
                        <select
                            value={filtros.tipo}
                            onChange={e => setFiltro('tipo', e.target.value)}
                            className="input-filtro"
                            style={{ flex: '1 1 140px', minWidth: '130px' }}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="info">Info</option>
                            <option value="exito">Éxito</option>
                            <option value="error">Error</option>
                            <option value="critico">Crítico</option>
                        </select>
                        <input
                            type="date"
                            value={filtros.fecha_inicio}
                            onChange={e => setFiltro('fecha_inicio', e.target.value)}
                            className="input-filtro"
                            style={{ flex: '1 1 150px', minWidth: '140px' }}
                        />
                        <input
                            type="date"
                            value={filtros.fecha_fin}
                            onChange={e => setFiltro('fecha_fin', e.target.value)}
                            className="input-filtro"
                            style={{ flex: '1 1 150px', minWidth: '140px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <button className="btn btn-primary" onClick={filtrar} style={{ marginTop: 0 }} disabled={cargando}>Filtrar</button>
                            <button className="btn btn-warning" onClick={limpiarFiltros} style={{ marginTop: 0 }} disabled={cargando}>Limpiar</button>
                        </div>
                    </div>

                    {/* Contador */}
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '12px' }}>
                        {logs.length} registros
                        {totalPaginas > 1 && ` — Página ${paginaActual} de ${totalPaginas}`}
                        {' '}— Clic en una fila para ver detalles
                    </p>

                    {/* Tabla */}
                    <div className="tabla-contenedor">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>Acción</th>
                                    <th>Descripción</th>
                                    <th>IP</th>
                                    <th>Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logsPaginados.length === 0 && !cargando && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                                            No hay registros
                                        </td>
                                    </tr>
                                )}
                                {logsPaginados.map(l => {
                                    const tc = TIPO_COLORES[l.tipo] || TIPO_COLORES.info;
                                    return (
                                        <tr key={l.id} onClick={() => setLogDetalle(l)} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontSize: '0.8rem' }}>
                                                {new Date(l.fecha).toLocaleString('es-CO')}
                                            </td>
                                            <td>{l.usuario_nombre || '—'}</td>
                                            <td>{l.usuario_role || '—'}</td>
                                            <td style={{ color: 'var(--gold)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem' }}>
                                                {l.accion}
                                            </td>
                                            <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {l.descripcion}
                                            </td>
                                            <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                                {l.ip || '—'}
                                            </td>
                                            <td>
                                                <span style={{
                                                    background: tc.bg,
                                                    color: tc.color,
                                                    padding: '3px 10px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    border: `1px solid ${tc.color}33`,
                                                    borderRadius: '4px',
                                                    display: 'inline-block',
                                                }}>
                                                    {tc.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
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

            </div>
        </>
    );
}