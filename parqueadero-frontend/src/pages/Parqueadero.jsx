import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function parqueadero() {
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
    const esCelador = usuario.role === 'celador';


    useEffect(() => {
        if (!localStorage.getItem('Token')) { navigate('/login'); return; }
        cargarEstado();
        const intervalo = setInterval(cargarEstado, 30000);
        return () => clearInterval(intervalo);
    }, []);

    const cargarEstado = async () => {
        try {
            const res = await api.get('/parqueadero/estado');
            setEstado(res.data);
            setConfig({
                espacios_carros: res.data.capacidad.carro,
                espacios_motos: res.data.capacidad.moto,
                espacios_otros: res.data.capacidad.otro,
            });
        } catch {
            setError('Error al cargar el estado del parqueadero');
        }
    };

    const guardarConfig = async () => {
        try {
            await api.put('/parqueadero/configuracion', config);
            setExito('Configuracion actualizada');
            setEditandoConfig(false);
            cargarEstado();
        } catch {
            setError('Error al guardar configuracion');
        }
    };

    const toogleParqueadero = async (activar) => {
        try {
            await api.put('/parqueadero/toggle', {
                activo: activar,
                motivo_cierre: motivoCierre
            });
            setExito(activar ? 'parqueadero habilitado exitosamente' : 'Parqueadero desabilitado exitosamente');
            setModalCierre(false);
            setMotivoCierre('');
            cargarEstado();
        } catch {
            setError('Error al cambiar el estado del parqueadero');
        }
    };

    const porcentajeOcupado = (ocupado, total) => total > 0 ? MAth.round((ocupado / total) * 100) : 0;

    const colorBarra = (pct) => pct >= 100 ? '#e74c3c' : pct >= 75 ? '#f39c12' : '#2ecc71';

    const colorCard = (disponible, total) => {
        const pct = porcentajeOcupado(total - diponible, total);
        return pct >= 100 ? '#e74c3c' : pct >= 75 ? '#f39c12' : '#2ecc71';
    };

    if (!estado) return <><Navbar /><div className='pagina'>Cargando...</div></>;

    const ripos = [
        { key: 'carro', label: 'Carros', icon: '🚗', disponible: estado.disponibles.carro, ocupado: estado.ocupados.carro, total: estado.capacidad.carro },
        { key: 'moto', label: 'motos', icon: '🏍️', disponible: estado.disponibles.moto, ocupado: estado.ocupados.moto, total: estado.capacidad.moto },
        { key: 'otro', label: 'otros', icon: '🚌', disponibles: estado.disponible.moto, ocupado: estado.ocupados.otro, total: estado.capacidad.otro },
    ];

    return (
        <>
            <Navbar />

            {/* modal de cierre  */}
            {modalCierre && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '440px', maxWidth: '95vw' }}>
                        <h3 style={{ marginBottom: '16px', color: '#e74c3c' }}>Desabilitar Parqueadero</h3>
                        <p style={{ color: '#666', marginBottom: '16px' }}>Ingresa el motivo del cierre. Esto bloqueara todas las entradas.</p>
                        <textarea
                            value={motivoCierre}
                            onChange={e => setMotivoCierre(e.target.value)}
                            placeholder='EJ: Mantenimiento general, obras, etc.'
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px', marginBottom: '16px', resize: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className='btn btn-danger' style={{ flex: 1 }} onClick={() => toggleParqueadero(false)}>
                                Confirmar cierre
                            </button>
                            <button className='btn btn-warning' style={{ flex: 1 }} onClick={() => setModalCierre(false)}>
                                cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className='pagina'>
                {/* header de estado  */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>🅿️ Estado del Parqueadero</h1>
                    <div style={{
                        display: 'inline-block', padding: '8px 24px', borderRadius: '20px',
                        background: estado.parqueadero_activo ? '#2ecc71' : '#e74c3c',
                        color: 'white', fontWeight: 'bold', fontSize: '1rem'
                    }}>
                        {estado.parqueadero_activo ? '🟢 Abierto' : '🔴 Cerrado'}
                    </div>
                    {!estado.parqueadero_activo && estado.motivo_cierre && (
                        <p style={{ marginTop: '8px', color: '#e74c3c', fontWeight: '600' }}>
                            Motivo: {estado.motivo_cierre}
                        </p>
                    )}
                </div>
                {error && <div className='alerta alerta-error'>{error}</div>}
                {exito && <div className='alerta alerta-exito'>{exito}</div>}

                {/* card de espacios  */}
                {usuario.role === 'user' ? (
                    // vistas del usuarios 
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        {tipos.map(t => (
                            <div key={t.key} style={{
                                background: `linear-grandient(135deg, ${colorCard(t.disponible, t.total)}, ${colorCard(t.disponible, t.total)}99)`,
                                borderRadius: '20px', padding: '40px 32px', textAlign: 'center',
                                color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                transform: 'translateY(0)', transition: 'transform 0.2s',
                                cursor: 'default'
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{t.icon}</div>
                                <div style={{ fontSize: '5rem', fontWeight: '900', lineHeight: 1, marginBottom: '8px' }}>
                                    {t.disponible}
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', ocapacity: 0.9 }}>
                                    espacios disponible
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.75, marginTop: '4px' }}>
                                    {t.label}
                                </div>
                                {t.disponible === 0 && (
                                    <div style={{ marginBottom: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        ⛔ SIN ESPACIOS
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    // vista admin y celador muestra todo completo 
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '24px', marginBottom: '32px' }}>
                        {tipos.map(t => {
                            const pct = porcentajeOcupado(t.ocipado, t.total);
                            return (
                                <div key={t.key} className='card' style={{ borderTop: `4px solid ${colorBarra(pct)}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                        <span style={{ fontSize: '2rem' }}>{t.icon}</span>
                                        <h3 style={{ margin: 0 }}>{t.label}</h3>
                                    </div>
                                    <span style={{
                                        background: colorBarra(pct), color: 'white',
                                        padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold'
                                    }}>
                                        {pct}%
                                    </span>
                                </div>

                                // barra de progreso 
                            )
                        })}
                )}

                    </div>

        </>
            )
                }