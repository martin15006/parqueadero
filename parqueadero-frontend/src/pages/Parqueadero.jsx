import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function Parqueadero() {
    const [estado, setEstado] = useState(null);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [config, setConfig] = useState({ espacios_carros: 0, espacios_motos: 0, espacios_otros: 0 });
    const [editandoConfig, setEditandoConfig] = useState(false);
    const [modalCierre, setModalCierre] = useState(false);
    const [motivoCierre, setMotivoCierre] = useState('');
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const esAdmin = usuario.role === 'admin';

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        cargarEstado();
        const intervalo = setInterval(cargarEstado, 4000);
        return () => clearInterval(intervalo);
    }, []);

    const cargarEstado = async () => {
        try {
            const res = await api.get('/parqueadero/estado');
            setEstado(res.data);
            setConfig({
                espacios_carros: res.data.capacidad.carro,
                espacios_motos: res.data.capacidad.moto ,
                espacios_otros: res.data.capacidad.otro ,
            });
        } catch {
            setError('Error al cargar el estado del parqueadero');
        }
    };

    const guardarConfig = async () => {
        try {
            const datos = {};

            if (config.espacios_carros !== '' && config.espacios_carros !== undefined)
                datos.espacios_carros = config.espacios_carros;

            if (config.espacios_motos !== '' && config.espacios_motos !== undefined)
                datos.espacios_motos = config.espacios_motos;

            if (config.espacios_otros !== '' && config.espacios_otros !== undefined)
                datos.espacios_otros = config.espacios_otros;

            await api.put('/parqueadero/configuracion', datos);
            setExito('Configuración actualizada');
            setEditandoConfig(false);
            cargarEstado();
        } catch {
            setError('Error al guardar configuración');
        }
    };

    const toggleParqueadero = async (activar) => {
        try {
            await api.put('/parqueadero/toggle', {
                activo: activar,
                motivo_cierre: motivoCierre
            });
            setExito(activar ? '✅ Parqueadero habilitado' : '🔴 Parqueadero deshabilitado');
            setModalCierre(false);
            setMotivoCierre('');
            cargarEstado();
        } catch {
            setError('Error al cambiar el estado del parqueadero');
        }
    };

    const porcentajeOcupado = (ocupado, total) => total > 0 ? Math.round((ocupado / total) * 100) : 0;
    const colorBarra = (pct) => pct >= 100 ? '#e74c3c' : pct >= 75 ? '#f39c12' : '#2ecc71';
    const colorCard = (disponible, total) => {
        const pct = porcentajeOcupado(total - disponible, total);
        return pct >= 100 ? '#e74c3c' : pct >= 75 ? '#f39c12' : '#2ecc71';
    };

    if (!estado) return <><Navbar /><div className='pagina'>Cargando...</div></>;

    const tipos = [
        { key: 'carro', label: 'Carros', icon: '🚗', disponible: estado.disponibles.carro, ocupado: estado.ocupados.carro, total: estado.capacidad.carro },
        { key: 'moto', label: 'Motos', icon: '🏍️', disponible: estado.disponibles.moto, ocupado: estado.ocupados.moto, total: estado.capacidad.moto },
        { key: 'otro', label: 'Otros', icon: '🚌', disponible: estado.disponibles.otro, ocupado: estado.ocupados.otro, total: estado.capacidad.otro },
    ];

    return (
        <>
            <Navbar />

            {/* Modal de cierre */}
            {modalCierre && (
                <div className="modal-overlay" onClick={() => setModalCierre(false)}>
                    <div className="modal-rpg" onClick={e => e.stopPropagation()}>
                        <button className="modal-cerrar" onClick={() => setModalCierre(false)}>&times;</button>
                        <h3 style={{ marginBottom: '16px', color: 'var(--gold)' }}>🔴 Deshabilitar Parqueadero</h3>
                        <div className="glyph-divider"><span>✦</span></div>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '16px', fontStyle: 'italic' }}>Ingresa el motivo del cierre. Esto bloqueará todas las entradas.</p>
                        <textarea
                            value={motivoCierre}
                            onChange={e => setMotivoCierre(e.target.value)}
                            placeholder='Ej: Mantenimiento general, obras, etc.'
                            style={{ 
                                width: '100%', padding: '12px', borderRadius: '0', 
                                background: 'rgba(0,0,0,0.3)', border: '1px solid var(--gold-dim)', 
                                color: 'var(--text-body)', minHeight: '100px', marginBottom: '20px', resize: 'none' 
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className='btn btn-danger' style={{ flex: 1 }} onClick={() => toggleParqueadero(false)}>
                                Confirmar cierre
                            </button>
                            <button className='btn btn-warning' style={{ flex: 1 }} onClick={() => setModalCierre(false)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className='pagina'>
                {/* Header de estado */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div className="glyph-divider"><span>ᛟ</span></div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>Estado del Parqueadero</h1>
                    <div className="glyph-divider" style={{ marginBottom: '24px' }}><span>✦</span></div>
                    
                    <div style={{
                        display: 'inline-block', padding: '10px 32px', border: '1px solid',
                        borderColor: estado.parqueadero_activo ? '#2ecc71' : 'var(--crimson)',
                        background: estado.parqueadero_activo ? 'rgba(46,204,113,0.1)' : 'rgba(139,26,26,0.1)',
                        color: estado.parqueadero_activo ? '#2ecc71' : 'var(--crimson-glow)', 
                        fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'var(--font-heading)',
                        letterSpacing: '2px', textTransform: 'uppercase'
                    }}>
                        {estado.parqueadero_activo ? '🟢 Abierto' : '🔴 Cerrado'}
                    </div>
                    {!estado.parqueadero_activo && estado.motivo_cierre && (
                        <p style={{ marginTop: '16px', color: 'var(--crimson-glow)', fontWeight: '600', fontStyle: 'italic', fontSize: '1.1rem' }}>
                            Motivo del Cierre: {estado.motivo_cierre}
                        </p>
                    )}
                </div>

                {error && <div className='alerta alerta-error'>{error}</div>}
                {exito && <div className='alerta alerta-exito'>{exito}</div>}

                {/* Cards de espacios */}
                {usuario.role === 'user' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        {tipos.map(t => (
                            <div key={t.key} className="card" style={{
                                background: `linear-gradient(135deg, rgba(91, 27, 175, 0.4), rgba(0, 0, 0, 0.8))`,
                                textAlign: 'center', padding: '40px 32px',
                                border: `1px solid ${colorCard(t.disponible, t.total)}55`,
                                transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default'
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.boxShadow = `0 0 20px ${colorCard(t.disponible, t.total)}33`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{t.icon}</div>
                                <div style={{ 
                                    fontSize: '5rem', fontWeight: '900', lineHeight: 1, marginBottom: '8px', 
                                    color: colorCard(t.disponible, t.total), fontFamily: 'var(--font-title)',
                                    textShadow: `0 0 15px ${colorCard(t.disponible, t.total)}44`
                                }}>
                                    {t.disponible}
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Disponibles
                                </div>
                                <div style={{ fontSize: '1.3rem', color: 'var(--gold)', marginTop: '8px', fontFamily: 'var(--font-heading)' }}>
                                    {t.label}
                                </div>
                                {t.disponible === 0 && (
                                    <div style={{ 
                                        marginTop: '16px', border: '1px solid var(--crimson)', 
                                        background: 'rgba(139,26,26,0.2)', color: 'var(--crimson-glow)',
                                        padding: '8px 12px', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1px' 
                                    }}>
                                        ⛔ CAPACIDAD MÁXIMA
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        {tipos.map(t => {
                            const pct = porcentajeOcupado(t.ocupado, t.total);
                            return (
                                <div key={t.key} className='card' style={{ borderLeft: `4px solid ${colorBarra(pct)}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '2.5rem' }}>{t.icon}</span>
                                            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>{t.label}</h3>
                                        </div>
                                        <span style={{
                                            border: `1px solid ${colorBarra(pct)}`, color: colorBarra(pct),
                                            padding: '4px 12px', background: `${colorBarra(pct)}11`,
                                            fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'var(--font-title)'
                                        }}>
                                            {pct}%
                                        </span>
                                    </div>

                                    {/* Barra de progreso RPG */}
                                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--gold-dim)', height: '14px', marginBottom: '20px', position: 'relative' }}>
                                        <div style={{
                                            width: `${Math.min(pct, 100)}%`, height: '100%',
                                            background: `linear-gradient(90deg, ${colorBarra(pct)}99, ${colorBarra(pct)})`,
                                            boxShadow: `0 0 10px ${colorBarra(pct)}44`,
                                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(168,160,184,0.1)', padding: '12px' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2ecc71', fontFamily: 'var(--font-title)' }}>{t.disponible ?? 0}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Libres</div>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(168,160,184,0.1)', padding: '12px' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--crimson-glow)', fontFamily: 'var(--font-title)' }}>{t.ocupado ?? 0}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ocupados</div>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(168,160,184,0.1)', padding: '12px' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--gold)', fontFamily: 'var(--font-title)' }}>{t.total ?? 0}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total</div>
                                        </div>
                                    </div>

                                    {pct >= 100 && (
                                        <div style={{ marginTop: '16px', border: '1px solid var(--crimson)', color: 'var(--crimson-glow)', background: 'rgba(139,26,26,0.1)', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '1px' }}>
                                            ⛔ SECTOR COMPLETO
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Panel de control solo admin */}
                {esAdmin && (
                    <>
                        <div className='card' style={{ borderLeft: '4px solid var(--gold)' }}>
                            <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>⚙️ Gestión del Reino</h3>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                {estado.parqueadero_activo ? (
                                    <button className='btn btn-danger' style={{ padding: '12px 24px' }} onClick={() => setModalCierre(true)}>
                                        🔴 Deshabilitar Parqueadero
                                    </button>
                                ) : (
                                    <button className='btn btn-success' style={{ padding: '12px 24px' }} onClick={() => toggleParqueadero(true)}>
                                        ✅ Habilitar Parqueadero
                                    </button>
                                )}
                                <button className='btn btn-primary' style={{ padding: '12px 24px' }} onClick={() => setEditandoConfig(!editandoConfig)}>
                                    ✏️ {editandoConfig ? 'Cancelar Edición' : 'Ajustar Capacidades'}
                                </button>
                            </div>
                        </div>

                        {editandoConfig && (
                            <div className='card' style={{ borderLeft: '4px solid var(--purple)' }}>
                                <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>📏 Ajustar Límites de Espacio</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    {[
                                        { label: '🚗 Espacios Carros', key: 'espacios_carros' },
                                        { label: '🏍️ Espacios Motos', key: 'espacios_motos' },
                                        { label: '🚌 Espacios Otros', key: 'espacios_otros' },
                                    ].map(campo => (
                                        <div key={campo.key} className='form-grupo'>
                                            <label style={{ color: 'var(--gold-light)' }}>{campo.label}</label>
                                            <input
                                                type='number' min='0'
                                                placeholder={`Actual: ${config[campo.key] ?? 0}`}
                                                onChange={e => setConfig({ ...config, [campo.key]: e.target.value })}
                                                style={{ padding: '12px', fontSize: '1rem' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button className='btn btn-success' style={{ marginTop: '24px', width: '100%' }} onClick={guardarConfig}>
                                    💾 Sellar Nuevas Capacidades
                                </button>
                            </div>
                        )}
                    </>
                )}

                <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '24px', fontStyle: 'italic' }}>
                    Sincronizando con el servidor cada 4 segundos...
                </p>
            </div>
        </>
    );
}