import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import api from "../api/axios";
import { Html5Qrcode } from 'html5-qrcode';

export default function Celador() {
    const [placa, setPlaca] = useState('');
    const [vehiculo, setVehiculo] = useState(null);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [escaneando, setEscaneando] = useState(false);
    const html5QrRef = useRef(null);
    const navigate = useNavigate();
    const [modalLleno, setModalLleno] = useState({ visible: false, mensaje: '' });

    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (!['admin', 'celador'].includes(usuario.role)) {
            navigate('/login');
        }

        return () => {
            if (html5QrRef.current) {
                html5QrRef.current.stop().catch(() => { });
            }
        };
    }, []);

    const iniciarEscaner = async () => {
        setError('');
        setEscaneando(true);
        const html5Qrcode = new Html5Qrcode('lector-qr');
        html5QrRef.current = html5Qrcode;
        try {
            await html5Qrcode.start(
                { facingMode: 'environment' }, //camara
                { fps: 10, qrbox: { width: 250, height: 250 } },

                async (textoQR) => {
                    await html5Qrcode.stop();
                    setEscaneando(false);

                    try {
                        const datos = JSON.parse(textoQR);
                        if (datos.tipo === 'visitante') {

                            // si tiene placa buscar por la placa 
                            if (datos.placa && datos.placa.trim() !== '') {
                                const resV = await api.get(`/visitantes/buscar/${datos.placa.toUpperCase().trim()}`);
                                setVehiculo({ ...resV.data, esVisitante: true });
                                setExito('Visitante encontrado-confirma la entrada');
                            } else {
                                // sin placa se busca por el nombre 
                                const resV = await api.get(`/visitantes/buscar-nombre/${encodeURIComponent(datos.nombre)}`);
                                setVehiculo({ ...resV.data, esVisitante: true });
                            }
                            setExito('Visitante encontrado - confirma la entrada');
                        } else {
                            setPlaca(datos.placa);
                            buscarPorPlaca(datos.placa);
                        }
                    } catch (err) {
                        setError(err.response?.data?.mensaje || 'Visitante no encontrado');
                    }
                },
                () => { }
            );
        } catch (err) {
            setError('No se pudo acceder a la camara');
            setEscaneando(false);
        }
    };


    const detenerEscaner = async () => {
        if (html5QrRef.current) {
            await html5QrRef.current.stop().catch(() => { });
        }
        setEscaneando(false);
    };

    const buscarPorPlaca = async (placaBuscar) => {
        const placaFinal = (placaBuscar || placa).trim().toUpperCase();
        setError('');
        setExito('');
        setVehiculo(null);
        try {
            // primero busca en usuarios registrados
            const res = await api.get(`/vehiculos/buscar/${placaFinal}`);
            setVehiculo({ ...res.data, esVisitante: false });
        } catch {
            try {
                const resV = await api.get(`/visitantes/buscar/${placaFinal}`);
                setVehiculo({ ...resV.data, esVisitante: true });
            } catch {
                setError('vehiculo no encontrado');
            }
        }
    };

    const registrarMovimiento = async (tipo) => {
        setError('');
        setExito('');
        try {
            await api.post('/registros', { placa: vehiculo.placa, tipo });
            setExito(`${tipo === 'entrada' ? '🟢 Entrada' : '🔴 Salida'} registrada exitosamente`);
            setVehiculo(null);
            setPlaca('');
        } catch (err) {
            const mensaje = err.response?.data?.mensaje || 'Error al registrar';
            const esCierre = err.response?.data?.parqueadero_desabilitado;
            const esTipoLleno = err.response?.data?.tipo_lleno;

            if (esCierre || esTipoLleno) {
                setModalLleno({ visible: true, mensaje });
            } else {
                setError(mensaje);
            }
        }
    };

    return (
        <>
            <Navbar />
            {/* Modal parqueadero lleno  */}
            {modalLleno.visible && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '400px', maxWidth: '95vw', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⛔</div>
                        <h3 style={{ color: '#e74c3c', marginBottom: '12px' }}>Parqueadero Lleno</h3>
                        <p style={{ color: '#666', marginBottom: '24px' }}>{modalLleno.mensaje}</p>
                        <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 32px' }}
                            onClick={() => setModalLleno({ visible: false, mensaje: '' })}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            <div className="pagina">
                <h1>Panel Celador</h1>
                {error && <div className="alerta alerta-error">{error}</div>}
                {exito && <div className="alerta alerta-exito">{exito}</div>}

                {/* excaner QR  */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Excanear codigo QR</h3>
                    <div id="lector-qr" style={{ width: '100%' }}></div>
                    {!escaneando ? (
                        <button className="btn btn-primary" onClick={iniciarEscaner} style={{ marginTop: '12px' }}>
                            Iniciar escaner
                        </button>
                    ) : (
                        <button className="btn btn-danger" onClick={detenerEscaner} style={{ marginTop: '12px' }}>
                            Detener escaner
                        </button>
                    )}
                </div>
                {/* buscar por placa  */}

                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>Buscar por la placa</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        buscarPorPlaca();
                    }}
                        style={{ display: 'flex', gap: '12px' }}>
                        <input
                            style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', overflow: 'auto', width: '100%' }}
                            placeholder="EJ: ABC123"
                            value={placa}
                            onChange={e => setPlaca(e.target.value.toUpperCase())}
                            required
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', overflow: 'auto' }}>
                            Buscar
                        </button>
                    </form>
                </div>
                {/* datos del vehiculo  */}
                {vehiculo && (
                    <div className="card">
                        {/* tipo  */}
                        <div style={{ marginBottom: '16px' }}>
                            {vehiculo.esVisitante ? (
                                <span style={{ background: '#f39c12', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
                                    Visitante Temporal
                                </span>
                            ) : (
                                <span style={{ background: '#2b00ff', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
                                    Usuario Registrado
                                </span>
                            )}
                        </div>

                        <h3 style={{ marginBottom: '20px' }}>Informacion del {vehiculo.esVisitante ? 'Visitante' : 'Propietario'}</h3>
                        <div className='filtros-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                            <div className="tabla-contenedor">
                                <h4 style={{ marginBottom: '12px', color: '#4361ee' }}>
                                    {vehiculo.esVisitante ? 'Visitante' : 'Propietario'}
                                </h4>
                                <div className='tabla-contenedor'>
                                    <table className="tabla">
                                        <tbody>
                                            <tr><td><strong>Nombre</strong></td><td>{vehiculo.nombre}</td></tr>
                                            <tr><td><strong>Apellido</strong></td><td>{vehiculo.apellido || '-'}</td></tr>
                                            <tr><td><strong>Cedula</strong></td><td>{vehiculo.esVisitante ? (vehiculo.documento || '-') : (vehiculo.cedula || '-')}</td></tr>
                                            <tr><td><strong>Telefono</strong></td><td>{vehiculo.telefono || '-'}</td></tr>

                                            <tr><td><strong>correo</strong></td><td>{vehiculo.esVisitante ? (vehiculo.correo || '-') : (vehiculo.email || '-')}</td></tr>
                                            {vehiculo.esVisitante && (
                                                <tr><td><strong>Descripcion</strong></td><td>{vehiculo.descripcion || '-'}</td></tr>
                                            )}

                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {/* datos del vehiculo  */}
                            <div>
                                <h4 style={{ marginBottom: '12px', color: '#4488e1' }}>Vehiculo</h4>
                                <div className="tabla-contenedor">
                                    <table className="tabla">
                                        <tbody>
                                            <tr><td><strong>Placa</strong></td><td>{vehiculo.placa || '-'}</td></tr>
                                            <tr><td><strong>Tipo</strong></td><td>{vehiculo.tipo_vehiculo || vehiculo.tipo || '-'}</td></tr>
                                            <tr><td><strong>Marca</strong></td><td>{vehiculo.marca || '-'}</td></tr>
                                            <tr><td><strong>Modelo</strong></td><td>{vehiculo.modelo || '-'}</td></tr>
                                            <tr><td><strong>Color</strong></td><td>{vehiculo.color || vehiculo.descripcion || '-'}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {vehiculo.esVisitante ? (
                                vehiculo.estado === 'pendiente' ? (
                                    // Visitantes pendiente- solo puede entrar 
                                    <button className="btn btn-success" style={{ flex: 1, padding: '14px' }}
                                        onClick={async () => {
                                            try {
                                                await api.put(`/visitantes/${vehiculo.id}/entrada`);
                                                setExito('Entrada de visitante registrada');
                                                setVehiculo(null);
                                                setPlaca('');
                                            } catch (err) {
                                                setError(err.response?.data?.mensaje || 'Error al registrar entrada');
                                            }
                                        }}>
                                        Registrar Entrada Visitante
                                    </button>
                                ) : vehiculo.estado === 'adentro' ? (

                                    // para visitantes que ya entraron solo muestra la salida 

                                    <button className="btn btn-danger" style={{ flex: 1, padding: '14px' }}
                                        onClick={async () => {
                                            try {
                                                await api.put(`/visitantes/${vehiculo.id}/salida`);
                                                setExito('Salida del visitante registrada - QR invalidado');
                                                setVehiculo(null);
                                                setPlaca('');
                                            } catch (err) {
                                                setError(err.response?.data.mensaje || 'Error');
                                            }
                                        }}>
                                        Registrar Salida del visitante
                                    </button>
                                ) : (
                                    <button className="btn btn-success" style={{ flex: 1, padding: '14px' }}
                                        onClick={async () => {
                                            try {
                                                await api.post('/visitantes/entrada-qr', {
                                                    qr_data: JSON.stringify({ tipo: 'visitante', nombre: vehiculo.nombre })
                                                });
                                                setExito('Entrada del visitante registrada');
                                                setVehiculo(null);
                                                setPlaca('');
                                            } catch (err) {
                                                setError(err.response?.data?.mensaje || 'Error');
                                            }
                                        }}>
                                        Confirmar Entrada del Visitante
                                    </button>
                                )
                            ) : (
                                // para usuarios registrados, mostrar entrada y salida 
                                <>
                                    <div style={{ overflow: 'auto', width: '100%' }}>
                                        <button className="btn btn-success" style={{ flex: 1, padding: '14px' }}
                                            onClick={() => registrarMovimiento('entrada')}>
                                            Registrar Entrada
                                        </button>
                                        <button className="btn btn-danger" style={{ flex: 1, padding: '14px' }}
                                            onClick={() => registrarMovimiento('salida')}>
                                            Registrar Salida
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div >
        </>
    );
}