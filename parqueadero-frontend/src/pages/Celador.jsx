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

    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (!['admin', 'celador'].includes(usuario.role)) {
            navigate('/login');
            navigate('/perfil');
        }

        return () => {
            if (html5QrRef.current) {
                html5QrRef.current.stop().catch(() => { });
            }
        };
    }, []);

    const iniciarEscaner = async () => {
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
                        setPlaca(datos.placa);
                        buscarPorPlaca(datos.placa);
                    } catch {
                        setError('QR invalido');
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
        const placaFinal = placaBuscar || placa;
        setError('');
        setExito('');
        setVehiculo(null);
        try {
            const res = await api.get(`/vehiculos/buscar/${placaFinal}`);
            setVehiculo(res.data);
        } catch {
            setError('vehiculo no encontrado');
        }
    };

    const registrarMovimiento = async (tipo) => {
        setError('');
        setExito('');
        try {
            await buscarPorPlaca(vehiculo.placa);
            await api.post('/registros', { placa: vehiculo.placa, tipo });
            setExito(`${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente`);
            setVehiculo(null);
            setPlaca('');
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al registrar');
        }
    };

    return (
        <>
            <Navbar />
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
                    <form onSubmit={(e) => { e.preventDefault(); buscarPorPlaca(); }}
                        style={{ display: 'flex', gap: '12px' }}>
                        <input
                            style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }}
                            placeholder="EJ: ABC123"
                            value={placa}
                            onChange={e => setPlaca(e.target.value.toUpperCase())}
                            required
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                            Buscar
                        </button>
                    </form>
                </div>
                {/* datos del vehiculo  */}
                {vehiculo && (
                    <div className="card">
                        <h3 style={{ marginBottom: '20px' }}>Informacion</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            {/* datos del propietario  */}
                            <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                <h4 style={{ marginBottom: '12px', color: '#4a973b' }}>Propietaro</h4>
                                <table className="tabla">
                                    <tbody>
                                        <tr><td><strong>Nombre</strong></td><td>{vehiculo.nombre}</td></tr>
                                        <tr><td><strong>Apellido</strong></td><td>{vehiculo.apellido}</td></tr>
                                        <tr><td><strong>Cedula</strong></td><td>{vehiculo.cedula}</td></tr>
                                        <tr><td><strong>Telefono</strong></td><td>{vehiculo.telefono}</td></tr>
                                        <tr><td><strong>Email</strong></td><td>{vehiculo.email}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            {/* datos del vehiculo  */}
                            <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                <h4 style={{ marginBottom: '12px', color: '#4a973b' }}>Vehiculo</h4>
                                <table className="tabla">
                                    <tbody>
                                        <tr><td><strong>Placa</strong></td><td>{vehiculo.placa}</td></tr>
                                        <tr><td><strong>Tipo</strong></td><td>{vehiculo.tipo}</td></tr>
                                        <tr><td><strong>Marca</strong></td><td>{vehiculo.marca}</td></tr>
                                        <tr><td><strong>Modelo</strong></td><td>{vehiculo.modelo}</td></tr>
                                        <tr><td><strong>Color</strong></td><td>{vehiculo.color}</td></tr>

                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="btn btn-success"
                                style={{ flex: 1, padding: '14px' }}
                                onClick={() => registrarMovimiento('entrada')}>
                                Registrar Entrada
                            </button>

                            <button
                                className="btn btn-danger"
                                style={{ flex: 1, padding: '14px' }}
                                onClick={() => registrarMovimiento('salida')}>
                                Registrar Salida
                            </button>
                        </div>
                    </div>
                )}
            </div >
        </>
    );
}