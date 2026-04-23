import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import ExcelJS from "exceljs";

export default function Visitantes() {
    const [visitantes, setVisitantes] = useState([]);
    const [form, setForm] = useState({
        nombre: '', apellido: '', documento: '', telefono: '', correo: '',
        tipo_vehiculo: 'carro', placa: '', marca: '', modelo: '',
        color: '', descripcion: ''
    });
    const [qrGenerado, setQrGenerado] = useState('');
    const [nombreQR, setNombreQR] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [placaQR, setPlacaQR] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (usuario.role !== 'admin') { navigate('/login'); return; }
        cargarVisitante();
    }, []);

    const cargarVisitante = async () => {
        try {
            const res = await api.get('/visitantes');
            setVisitantes(res.data);
        } catch {
            setError('Error al cargar visitantes');
        }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setExito(''); setQrGenerado('');
        try {
            const res = await api.post('/visitantes', form);
            setExito('Visitantes registrado exitosamente. Muestra el QR para que el celador lo escanee.');
            setQrGenerado(res.data.qr_temporal);
            setNombreQR(form.nombre);
            setPlacaQR(res.data.placa || '');
            setForm({
                nombre: '', apellido: '', documento: '',
                telefono: '', correo: '', tipo_vehiculo: 'carro',
                placa: '', marca: '', modelo: '',
                color: '', descripcion: ''
            });
            cargarVisitante();
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al registrar visitante');
        }
    };

    const descargarQR = () => {
        const link = document.createElement('a');
        link.href = qrGenerado;
        link.download = `QR_visitante_${nombreQR}.png`;
        link.click();
    };

    const registrarSalida = async (id, nombre) => {
        if (!window.confirm(`¿Registrar salida de ${nombre}?`)) return;
        try {
            await api.put(`/visitantes/${id}/salida`);
            cargarVisitante();
        } catch {
            setError('Error al registrar salida');
        }
    };

    const adentro = visitantes.filter(v => v.estado === 'adentro');
    const pendientes = visitantes.filter(v => v.estado === 'pendiente');
    const afuera = visitantes.filter(v => v.estado === 'afuera');

    const cargarDesdeExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        setExito('');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const hoja = workbook.Sheets[workbook.SheetNames[0]];
                const filas = XLSX.utils.sheet_to_json(hoja);

                let registrados = 0;
                let omitidos = 0;
                let errores = [];


                for (const fila of filas) {
                    try {
                        await api.post('/visitantes', {
                            nombre: String(fila.nombre || fila.Nombre || '').trim(),
                            apellido: (fila.apellido || fila.Apellido || '').trim(),
                            documento: String(fila.documento || fila.Documento || '').trim(),
                            telefono: String(fila.telefono || fila.Telefono || '').trim(),
                            correo: String(fila.correo || fila.Correo || '').trim(),
                            tipo_vehiculo: String(fila.tipo_vehiculo || fila.Tipo_vehiculo || 'carro').trim(),
                            placa: String(fila.placa || fila.Placa || '').trim(),
                            marca: String(fila.marca || fila.Marca || '').trim(),
                            modelo: String(fila.modelo || fila.Modelo || '').trim(),
                            color: String(fila.color || fila.Color || '').trim(),
                            descripcion: String(fila.descripcion || fila.Descripcion || '').trim(),
                        });
                        registrados++;

                    } catch (err) {
                        omitidos++;
                        errores.push(`Fila${registrados + omitidos}: ${err.response?.data?.mensaje || 'Error'}`);
                    }
                }

                setExito(`✅${registrados} visitantes registrados. ${omitidos > 0 ? `${omitidos} omitidos.` : ''}`);
                if (errores.length > 0) {
                    setError(errores.slice(0, 3).join(' | '));
                }
                cargarVisitante();
            } catch {
                setError('Error al leer el archivo Excel');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const descargarPlantillaExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Visitantes");

        const columnas = [
            "nombre", "apellido", "documento", "telefono", "correo",
            "tipo_vehiculo", "placa", "marca", "modelo", "color", "descripcion"
        ];

        // 🔥 CREAR TABLA REAL DE EXCEL (ESTO REEMPLAZA TODO TU ESTILO MANUAL)
        sheet.addTable({
            name: "TablaVisitantes",
            ref: "A1",
            headerRow: true,
            style: {
                theme: "TableStyleMedium8", // 🎨 puedes cambiarlo es para el diseño en general 
                showRowStripes: true,
                showColumnStripes: false
            },
            columns: columnas.map(col => ({ name: col })),
            rows: Array.from({ length: 20 }, () =>
                columnas.map(() => "")
            )
        });

        // 📏 Ajustar ancho de columnas
        columnas.forEach((col, index) => {
            sheet.getColumn(index + 1).width = 18;
        });

        // 🎯 (Opcional PRO) Centrar contenido
        sheet.eachRow((row, rowNumber) => {
            row.height = 18;

            row.eachCell((cell) => {
                cell.alignment = {
                    vertical: "middle",
                    horizontal: "center"
                };
            });
        });

        // 📥 Descargar archivo
        const buffer = await workbook.xlsx.writeBuffer();

        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "plantilla_visitantes.xlsx";
        a.click();

        window.URL.revokeObjectURL(url);
    };

    return (
        <>
            <Navbar />
            <div className='pagina'>
                <h1>Modulo de visitantes</h1>
                {error && <div className='alerta alerta-error'>{error}</div>}
                {exito && <div className='alerta alerta-exito'>{exito}</div>}

                {/* QR generado  */}

                {qrGenerado && (
                    <div className='card' style={{ textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '12px' }}>QR del visitante- {nombreQR}</h3>
                        <p style={{ color: '#666', marginBottom: '16px' }}>
                            Muestrale este QR al visitante para que el celador lo escanee al entrar
                        </p>
                        <img src={qrGenerado} alt='QR Visitante' style={{ width: '200px', height: '200px' }} />
                        {placaQR && (
                            <h3 style={{ margin: '12px 0 4px', color: '#1a1a2e' }}>{placaQR}</h3>
                        )}
                        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '16px' }}>
                            Este QR se invalida automaticamente cuando el visitante registre la salida.
                        </p>
                        <button className='btn btn-success' onClick={descargarQR} style={{ width: 'auto' }}>
                            Descargar QR
                        </button>
                    </div>
                )}

                <div className='card'>
                    <div className='top-bar'>
                        <h3>Carga masiva desde Excel</h3>

                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                descargarPlantillaExcel();
                            }}
                            style={{ color: '#4361ee', fontSize: '0.9rem' }}
                        >
                            📥 Descargar Plantilla
                        </a>
                    </div>

                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>
                        Sube un archivo Excel con los datos de los visitantes. Se omitirán automáticamente los registros con datos duplicados.
                    </p>

                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={cargarDesdeExcel}
                        style={{
                            padding: '8px',
                            border: '2px dashed #ddd',
                            borderRadius: '8px',
                            width: '100%',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* formulario */}
                <div className='card'>
                    <h3 style={{ marginBottom: '16px' }}>Registrar nuevo visitante</h3>
                    <form onSubmit={handleSubmit}>
                        <div className='form-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className='form-grupo'>
                                <label>Nombre</label>
                                <input name='nombre' value={form.nombre} onChange={handleChange} required />
                            </div>
                            <div className='form-grupo'>
                                <label>Apellido</label>
                                <input name='apellido' value={form.apellido} onChange={handleChange} />
                            </div>
                            <div className='form-grupo'>
                                <label>Numero de Documento</label>
                                <input name='documento' value={form.documento} onChange={handleChange} required />
                            </div>
                            <div className='form-grupo'>
                                <label>Telefono</label>
                                <input name='telefono' value={form.telefono} onChange={handleChange} />
                            </div>
                            <div className='form-grupo'>
                                <label>Correo</label>
                                <input name='correo' value={form.correo} onChange={handleChange} />
                            </div>
                            <div className='form-grupo'>
                                <label>Tipo de vehiculo</label>
                                <select name='tipo_vehiculo' value={form.tipo_vehiculo} onChange={handleChange}>
                                    <option value='carro'>Carro</option>
                                    <option value='moto'>Moto</option>
                                    <option value='otro'>Otro</option>
                                </select>
                            </div>
                            <div className='form-grupo'>
                                <label>Placa</label>
                                <input name='placa' value={form.placa} onChange={handleChange} />
                            </div>
                            <div className='form-grupo'>
                                <label>Marca</label>
                                <input name='marca' value={form.marca} onChange={handleChange} />
                            </div>
                            <div className='form-grupo'>
                                <label>Modelo</label>
                                <input name='modelo' value={form.modelo} onChange={handleChange} />
                            </div>
                            <div className='form-grupo'>
                                <label>Color</label>
                                <input name='color' value={form.color} onChange={handleChange} />
                            </div>
                            <div className='form-grupo' style={{ gridColumn: '1 / -1' }}>
                                <label>Descripcion del vehiculo</label>
                                <input name='descripcion' value={form.descripcion} onChange={handleChange} placeholder='caracteristicas adicionales...' />
                            </div>
                        </div>
                        <button type='submit' className='btn btn-primary' style={{ marginTop: '12px' }}>
                            Registrar visitante y generar QR
                        </button>
                    </form>
                </div>

                {/* pendientes de entrada  */}
                {pendientes.length > 0 && (
                    <div className='card'>
                        <h3 style={{ marginBottom: '16px' }}>Pendiente de entrada ({pendientes.length})</h3>
                        <table className='tabla'>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Documento</th>
                                    <th>Placa</th>
                                    <th>Vehiculo</th>
                                    <th>Registrado</th>
                                    <th>QR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendientes.map(v => (
                                    <tr key={v.id}>
                                        <td>{v.nombre}</td>
                                        <td>{v.documento || '-'}</td>
                                        <td>{v.placa || '-'} </td>
                                        <td>{v.tipo_vehiculo} {v.marca} {v.modelo}</td>
                                        <td>{new Date(v.fecha_entrada).toLocaleString()}</td>
                                        <td>
                                            <button className='btn btn-primary btn-sm'
                                                onClick={() => {
                                                    setQrGenerado(v.qr_temporal);
                                                    setNombreQR(v.nombre);
                                                    setPlacaQR(v.placa || '');
                                                }}>
                                                ver QR
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Visitantes adentro  */}
                <div className='card'>
                    <h3 style={{ marginBottom: '16px' }}>Visitantes actualmente adentro ({adentro.length})</h3>
                    {adentro.length === 0 ? (
                        <p style={{ color: '#888' }}>No hay visitantes actualmente.</p>
                    ) : (
                        <div className='tabla-contenedor'>
                            <table className='tabla'>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Documento</th>
                                        <th>Placa</th>
                                        <th>Vehiculo</th>
                                        <th>Entrada</th>
                                        <th>Accion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adentro.map(v => (
                                        <tr key={v.id}>
                                            <td>{v.nombre}</td>
                                            <td>{v.documento || '-'}</td>
                                            <td>{v.placa || '-'}</td>
                                            <td>{v.tipo_vehiculo} {v.marca} {v.modelo}</td>
                                            <td>{new Date(v.fecha_entrada).toLocaleString()}</td>
                                            <td>
                                                <button className='btn btn-danger btn-sm'
                                                    onClick={() => registrarSalida(v.id, v.nombre)}>
                                                    Registrar Salida
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                {/* historial visitantes  */}
                {afuera.length > 0 && (
                    <div className='card'>
                        <h3 style={{ marginBottom: '16px' }}>Visitantes que registraron la Salida ({afuera.length})</h3>
                        <div className='tabla-contenedor'>
                            <table className='tabla'>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Placa</th>
                                        <th>Entrada</th>
                                        <th>Salida</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {afuera.map(v => (
                                        <tr key={v.id}>
                                            <td>{v.nombre}</td>
                                            <td>{v.placa || '-'}</td>
                                            <td>{new Date(v.fecha_entrada).toLocaleString()}</td>
                                            <td>{v.fecha_salida ? new Date(v.fecha_salida).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}