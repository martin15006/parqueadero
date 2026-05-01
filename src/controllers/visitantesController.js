const db = require('../config/db');
const QRcode = require('qrcode');

const registrarVisitantes = async (req, res) => {
    try {
        const { nombre, apellido, documento, telefono, correo, tipo_vehiculo, placa, marca, modelo, color, descripcion } = req.body;

        const tiposValidos = ['carro','moto', 'otro'];
        const tipoFinal = tiposValidos.includes(tipo_vehiculo?.toLowerCase())
        ? tipo_vehiculo.toLowerCase()
        : 'carro';

        const placaFormateada = placa ? placa.toUpperCase().trim() : null;
        const admin_id = req.usuario.id;

        // Verificar que la placa no pertenesca a ningun usuario registrado 
        if (placaFormateada) {
            const [placaUsuarios] = await db.query(
                `SELECT id FROM vehiculos WHERE placa = ? `,
                [placaFormateada]
            );
            if (placaUsuarios.length > 0) {
                return res.status(400).json({ mensaje: '. Esa placa ya esta registrada por un usuario del sistema.' });
            }
        }

        // verificar que la cedula no pertenezca a ningun usuario registrado
        if (documento) {
            const [cedulaUsuario] = await db.query(
                `SELECT id FROM usuarios WHERE cedula = ?`,
                [documento]
            );
            if (cedulaUsuario.length > 0) {
                return res.status(400).json({ mensaje: 'Esa cedula ya esta registrada en el sistema' });
            }
        }

        // verificar que el correo no pertenesca a ningun usuario 
        if (correo) {
            const [correoUsuario] = await db.query(
                `SELECT id FROM usuarios WHERE email = ?`,
                [correo]
            );
            if (correoUsuario.length > 0) {
                return res.status(400).json({ mensaje: 'Ese correo ya se encuentra registrado en el sistema' });
            }
        }

        // generar QR temportal con datos del visitante 
        const datosQR = JSON.stringify({
            tipo: 'visitante',
            placa: placaFormateada || '',
            nombre,
            documento: documento || '',
            timestamp: Date.now()
        });
        const qrImagen = await QRcode.toDataURL(datosQR);


        // Guardar visitante en la tabla de visitantes 
        const [resultado] = await db.query(
            `INSERT INTO visitantes 
            (nombre, apellido, documento, telefono, correo, 
            tipo_vehiculo, placa, marca, modelo, color, descripcion, 
            registrado_por, estado, qr_temporal, fecha_entrada)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'pendiente', ?, NOW())`,
            [nombre, apellido, documento, telefono, correo, tipoFinal, placaFormateada, marca, modelo, color, descripcion, admin_id, qrImagen]
        );

        res.status(201).json({
            mensaje: 'Visitante registrado exitosamente',
            visitante_id: resultado.insertId,
            qr_temporal: qrImagen,
            placa: placaFormateada
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// ver todos los visitantes 
const getVisitantes = async (req, res) => {
    try {
        const [visitantes] = await db.query(
            `SELECT v.*, u.nombre as admin_nombre
            FROM visitantes v
            LEFT JOIN usuarios u ON v.registrado_por = u.id
            ORDER BY v.fecha_entrada DESC`
        );
        res.json(visitantes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// celador escanea QR de visitante - resgistra la entrada 
const registrarEntradaVisitante = async (req, res) => {
    try {
        const { qr_data } = req.body;
        const celador_id = req.usuario.id;

        let datos;
        try {
            datos = JSON.parse(qr_data);
        } catch {
            return res.status(400).json({ mensaje: 'QR invalido' });
        }

        if (datos.tipo !== 'visitante') {
            return res.status(400).json({ mensaje: 'Este QR no es de visitante' });
        }

        // Buscar visitante por placa si exite, osino por nombre
        let visitantes;
        if (datos.placa && datos.placa.trim() !== '') {
            [visitantes] = await db.query(
                `SELECT * FROM visitantes 
                WHERE placa = ? AND estado = 'pendiente'
                ORDER BY fecha_entrada DESC LIMIT 1`,
                [datos.placa.toUpperCase().trim()]
            );
        } else {
            [visitante] = await db.query(
                `SELECT * FROM visitantes WHERE nombre = ? AND estado = 'pendiente' ORDER BY fecha_entrada DESC LIMIT 1`,
                [datos.nombre]
            );
        }

        if (visitantes.length === 0) {
            return res.status(404).json({ mensaje: 'Visitante no encontrado o QR ya usado' });
        }

        const visitante = visitantes[0];

        if (visitante.qr_usado) {
            return res.status(400).json({ mensaje: 'El QR ya fue usado' });
        }



        // Marcar como adentro 
        await db.query(
            `UPDATE visitantes
            SET estado = 'adentro',
            celador_entrada_id = ?,
            qr_usado = 1
            WHERE id = ?`,
            [celador_id, visitante.id]
        );

        res.json({
            mensaje: 'Entrada de visitante registrada',
            esVisitante: true,
            visitante_id: visitante.id,
            visitante: {
                nombre: visitante.nombre,
                apellido: visitante.apellido,
                documento: visitante.documento,
                telefono: visitante.telefono,
                correo: visitante.correo,
                placa: visitante.placa,
                tipo_vehiculo: visitante.tipo_vehiculo,
                marca: visitante.marca,
                modelo: visitante.modelo,
                color: visitante.color,
                estado: 'adentro'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Celador registra salida del visitante 
const registrarSalidaVisitante = async (req, res) => {
    try {
        const { id } = req.params;
        const celador_id = req.usuario.id;

        const [visitantes] = await db.query('SELECT * FROM visitantes WHERE id = ?', [id])
        if (visitantes.length === 0) {
            return res.status(404).json({ mensaje: 'Visitante no encontrado' });
        }

        if (visitantes[0].estado !== 'adentro') {
            console.log('Estado actual:', visitantes[0].estado);
            return res.status(400).json({ mensaje: 'El visitante no esta registrado como adentro' });
        }

        // Al salir: se invalida el QR y marca como fuera 
        await db.query(
            `UPDATE visitantes SET estado = 'afuera', fecha_salida = NOW(), celador_salida_id = ?, qr_temporal = NULL WHERE id = ?`,
            [celador_id, id]
        );

        res.json({ mensaje: 'Salida del visitante registrada y QR invalidado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// Buscar visitante por placa (esto es para el celador)
const buscarVisitantePorPlaca = async (req, res) => {
    try {
        const { placa } = req.params;

        const [visitantes] = await db.query(
            `SELECT * FROM visitantes WHERE placa = ? AND estado IN ('pendiente', 'adentro') ORDER BY fecha_entrada DESC LIMIT 1`,
            [placa ? placa.toUpperCase().trim() : '']
        );

        if (visitantes.length === 0) {
            return res.status(404).json({ mensaje: 'No hay visitante activo con esa placa' });
        }

        res.json({ ...visitantes[0], esVisitante: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' })
    }
}

const registrarEntradaById = async (req, res) => {
    try {
        const { id } = req.params;
        const celador_id = req.usuario.id;

        const [visitantes] = await db.query(
            'SELECT * FROM visitantes WHERE id = ?', [id]
        );
        if (visitantes.length === 0) {
            return res.status(404).json({ mensaje: 'Visitante no encontrado' });
        }

        if (visitantes[0].estado !== 'pendiente') {
            return res.status(400).json({ mensaje: 'El visitante ya registro una entrada o ya salio' });
        }

        await db.query(
            `UPDATE visitantes SET estado = 'adentro', celador_entrada_id = ?, qr_usado = 1 WHERE id = ?`,
            [celador_id, id]
        );
        res.json({ mensaje: 'Entrada registrada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const buscarVisitantePorNombre = async (req, res) => {
    try {
        const { nombre } = req.params;
        const [visitantes] = await db.query(
            `SELECT * FROM visitantes WHERE nombre = ? AND estado IN ('pendiente', 'adentro') ORDER BY fecha_entrada DESC LIMIT 1`,
            [decodeURIComponent(nombre)]
        );
        if (visitantes.length === 0) {
            return res.status(404).json({ mensaje: 'Visitante no encontrado' });
        }
        res.json({ ...visitantes[0], esVisitante: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const eliminarVisitante = async (req, res) => {
    try {
        const { id } = req.params;

        const [visitantes] = await db.query('SELECT * FROM visitantes WHERE id = ?', [id]);
        if (visitantes.length === 0) {
            return res.status(404).json({ mensaje: 'Visitante no encontrado' });
        }

        await db.query('DELETE FROM visitantes WHERE id = ?', [id]);

        res.json({ mensaje: 'Visitante eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

module.exports = { registrarVisitantes, getVisitantes, registrarEntradaVisitante, registrarSalidaVisitante, buscarVisitantePorPlaca, registrarEntradaById, buscarVisitantePorNombre, eliminarVisitante };