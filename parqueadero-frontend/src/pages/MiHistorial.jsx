import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function MiHistorial() {
    const [historial, setHistorial] = useState([]);
    const [filtros, setFiltros] = useState({ fecha_inicio: '', fecha_fin: '', placa: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        try {
            const params = new URLSearchParams();
            if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
            if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
            if (filtros.placa) params.append('placa', filtros.placa);
            const res = await api.get(`/registros/mi-historial?${params.toString()}`);
            setHistorial(res.data);
        } catch {
            setError('Error al cargar historial')
        }
    };

    return (
        <>
            <Navbar />
            <div className='pagina'>
                <div className='glyph-divider'><span>ᛟ</span></div>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Mi Historial de Accesos</h1>
                <div className='glyph-divider' style={{ marginBottom: '3rem' }}><span>✦</span></div>
                {error && <div className='alerta alerta-error'>{error}</div>}

                <div className='card'>
                    <h3 style={{ marginBottom: '16px' }}>Filtros</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className='form-grupo' style={{margin: 0}}>
                            <label>Placa</label>
                            <input placeholder='ABC123' value={filtros.placa}
                            onChange={e=> setFiltros({...filtros, placa: e.target.value.toUpperCase()})}
                            className='input-filtro' />
                        </div>
                        <div className='form-grupo' style={{ margin: 0 }}>
                            <label>Desde</label>
                            <input type='date' value={filtros.fecha_inicio}
                                onChange={e => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                                className='input-filtro' />
                        </div>
                        <div className='form-grupo' style={{ margin: 0 }}>
                            <label>Hasta</label>
                            <input type='date' value={filtros.fecha_fin}
                                onChange={e => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                                className='input-filtro' />
                        </div>

                        <button className='btn btn-primary' onClick={cargarHistorial} style={{width: 'auto', marginTop:0}}>Filtrar</button>
                        <button className='btn btn-warning' onClick={() => {
                            setFiltros({ fecha_inicio: '', fecha_fin: '', placa: ''});
                            setTimeout(cargarHistorial, 100);
                        }} style={{ width: 'auto', marginTop: 0, height: '4em' }}>
                            Limpiar
                        </button>
                    </div>
                </div>

                <div className='card'>
                    <div className='top-bar'>
                        <h3>Mis accesos al parqueadero</h3>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{historial.length} registros</span>
                    </div>
                    {historial.length === 0 ? (
                        <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>No hay registros de acceso.</p>
                    ) : (
                        <div className='tabla-contenedor'>
                            <table className='tabla'>
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Placa</th>
                                        <th>Marca</th>
                                        <th>Modelo</th>
                                        <th>Celador</th>
                                        <th>Fecha y Hora</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.map(r => (
                                        <tr key={r.id}>
                                            <td>{r.tipo_registro === 'entrada' ? '🟢Entrada' : '🔴Salida'}</td>
                                            <td>{r.placa}</td>
                                            <td>{r.marca}</td>
                                            <td>{r.modelo}</td>
                                            <td>{r.celador || '-'}</td>
                                            <td>{new Date(r.fecha).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}