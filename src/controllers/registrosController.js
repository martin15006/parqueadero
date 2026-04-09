const db = require('../config/db');

// registrar entrada o salida

const registrarMovimiento = async (req, res) => {
    try {
        const { placa, tipo } = req.body;
        const celador_id = req.usuario_id;

        // 1. buscar el vehiculo por placa 
        const [vehiculos] = await db.query(
            'SELECT V.*, u.nombre, u.email FROM vehiculos v JOIN usuarios u ON v.usuario_id = u.id WHERE v.placa = ?',
            [placa]
        );

        if (vehiculos.length === 0) {
            return res.status(404).json({ mensaje: 'vehiculo no encontrado' });
        }

        const vehiculo = vehiculos[0];

        // 2.registrar el movimiento 
        console.log("TIPO RECIBIDO:", tipo);
        await db.query(
            'INSERT INTO registros (vehiculo_id, celador_id, tipo) VALUES (?,?,?)',
            [vehiculo.id, celador_id, tipo]
        );

        // 3.Devolver los datos del vehículo y su dueño
        res.status(200).json({
            mensaje: `${tipo} registrada exitosamente`,
            vehiculo: {
                placa: vehiculo.placa,
                marca: vehiculo.marca,
                modelo: vehiculo.modelo,
                color: vehiculo.color,
                tipo: vehiculo.tipo,
                propietario: vehiculo.nombre,
                email: vehiculo.email,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// ver el historial de registros 

const verHistorial = async (req, res) => {
    try {
        const [registros] = await db.query(
            `SELECT r.id, r.tipo AS tipo_registro, r.fecha,
            v.placa, v.marca, v.modelo, v.tipo AS tipo_vehiculo,
            u.nombre AS propietario,
            c.nombre AS celador
            FROM registros r 
            JOIN vehiculos v ON r.vehiculo_id = v.id
            JOIN usuarios u ON v.usuario_id = u.id
            LEFT JOIN usuarios c ON r.celador_id = c.id
            ORDER BY r.fecha DESC`
        );
        res.json(registros);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

module.exports = { registrarMovimiento, verHistorial };