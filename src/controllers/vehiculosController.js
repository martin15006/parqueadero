const db = require('../config/db');
const QRcode = require('qrcode');
const { registrarLog } = require('../utils/logger');


// añadir vehiculo y crear el qr 
const crearVehiculo = async (req, res) => {
    try {
        const { placa, marca, modelo, color, tipo } = req.body;

        const usuario_id = req.usuario.id;

        // 1. verifucar que la placa no existe
        const [existe] = await db.query(
            'SELECT id FROM vehiculos WHERE placa = ?',
            [placa]
        );
        if (existe.length > 0) {
            return res.status(400).json({ mensaje: 'esa placa ya fue registrada' });
        }

        const [conteo] = await db.query(
            'SELECT COUNT(*) as total FROM vehiculos WHERE usuario_id =?',
            [usuario_id]
        );
        if (conteo[0].total >= 3) {
            return res.status(400).json({
                mensaje: 'Limite alcanzado, Maximo de 3 vehiculos por usuario. contacta al administrador para eliminar un vehiculo.'
            });
        };
        // 2. crear el qr con los datos del vehiculos
        // el qr contiene un json con la informacion revelante 
        const datosQR = JSON.stringify({ placa, usuario_id });
        const qrImagen = await QRcode.toDataURL(datosQR);

        // 3. guardar en la base de datos
        const [resultado] = await db.query(
            `INSERT INTO vehiculos (placa, marca, modelo, color, tipo, usuario_id, qr_code)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [placa, marca, modelo, color, tipo, usuario_id, qrImagen]
        );

        res.status(201).json({
            mensaje: 'vehiculos registrados exitosamente',
            vehiculo_id: resultado.insertId,
            qr_code: qrImagen
        });

        await registrarLog({
            usuario_id: usuario_id,
            usuario_nombre: req.usuario.nombre || '',
            usuario_role: req.usuario.role,
            accion: 'REGISTRO_VEHICULO',
            descripcion: `Nuevo vehículo registrado: ${placa} (${marca} ${modelo})`,
            datos_nuevos: { placa, marca, modelo, color, tipo },
            ip: req.ip,
            tipo: 'info'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'error en el servidor' });
    }
};

// obtener la informacion del vehiculo del usuario

const misVehiculos = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;
        const [vehiculos] = await db.query(
            'SELECT id, placa, marca, modelo, color, tipo, qr_code, created_at FROM vehiculos WHERE usuario_id = ?',
            [usuario_id]
        );
        res.json(vehiculos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// buscar vehiculo por la placa (esto es para el celador)
const buscarPorPlaca = async (req, res) => {
    try {
        const { placa } = req.params;
        const [resultado] = await db.query(
            `SELECT v.*, u.nombre, u.apellido, u.cedula, u.telefono, u.email
            FROM vehiculos v 
            JOIN usuarios u ON v.usuario_id = u.id 
            WHERE v.placa =?`,
            [placa]
        );
        if (resultado.length === 0) {
            return res.status(404).json({ mensaje: 'vehiculo no encontrado' });
        }
        res.json(resultado[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// eliminar vehiculo (solo lo hace los administradores)
const eliminarVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        const [vehiculos] = await db.query(
            'SELECT * FROM vehiculos WHERE id = ?', [id]
        );

        if (vehiculos.length === 0) {
            return res.status(404).json({ mensaje: 'Vehículo no encontrado' });
        }

        const vehiculo = vehiculos[0];

        if (usuario.role === 'user' && vehiculo.usuario_id !== usuario.id) {
            return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este vehículo' });
        }

        // 1. Buscar registros del vehículo
        const [registrosVehiculo] = await db.query(
            'SELECT * FROM registros WHERE vehiculo_id = ?', [id]
        );

        // 2. Guardar cada registro en papelera
        for (const registro of registrosVehiculo) {
            await db.query(
                'INSERT INTO papelera (tabla_origen, datos, eliminado_por) VALUES (?, ?, ?)',
                ['registros', JSON.stringify(registro), usuario.id]
            );
        }

        // 3. Guardar vehículo en papelera
        await db.query(
            'INSERT INTO papelera (tabla_origen, datos, eliminado_por) VALUES (?, ?, ?)',
            ['vehiculos', JSON.stringify(vehiculo), usuario.id]
        );

        // 4. Eliminar el vehículo
        await db.query('DELETE FROM vehiculos WHERE id = ?', [id]);
        res.json({ mensaje: 'Vehículo eliminado exitosamente' });

        await registrarLog({
            usuario_id: req.usuario.id,
            usuario_nombre: req.usuario.nombre || '',
            usuario_role: req.usuario.role,
            accion: 'ELIMINACION_VEHICULO',
            descripcion: `Vehículo eliminado: ${vehiculo.placa}`,
            datos_anteriores: { placa: vehiculo.placa, marca: vehiculo.marca },
            ip: req.ip,
            tipo: 'critico'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const editarVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const { marca, modelo, color, tipo } = req.body;
        const usuario_id = req.usuario.id;

        // verificar que el vehiculo existe 
        const [vehiculos] = await db.query(
            'SELECT * FROM vehiculos WHERE id = ? AND usuario_id = ?', [id, usuario_id]
        );
        if (vehiculos.length === 0) {
            return res.status(404).json({ mensaje: 'Vehiculo no encontrado o no tienes permiso' });
        }

        await db.query(
            'UPDATE vehiculos SET marca = ?, modelo = ?, color = ?, tipo = ? WHERE id = ?',
            [marca, modelo, color, tipo, id]
        );

        const [actualizado] = await db.query(
            'SELECT id, placa, marca, modelo, color, tipo, qr_code FROM vehiculos WHERE id = ?', [id]
        )

        res.json({ mensaje: 'Vehiculo actualizado exitosamente', vehiculo: actualizado[0] });

        const anterior = vehiculos[0];
        await registrarLog({
            usuario_id: req.usuario.id,
            usuario_nombre: req.usuario.nombre || '',
            usuario_role: req.usuario.role,
            accion: 'EDICION_VEHICULO',
            descripcion: `Vehículo ${anterior.placa} editado`,
            datos_anteriores: { marca: anterior.marca, modelo: anterior.modelo, color: anterior.color, tipo: anterior.tipo },
            datos_nuevos: { marca, modelo, color, tipo },
            ip: req.ip,
            tipo: 'info'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

module.exports = { crearVehiculo, misVehiculos, buscarPorPlaca, eliminarVehiculo, editarVehiculo };