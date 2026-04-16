const db = require('../config/db');

// registrar entrada o salida

const registrarMovimiento = async (req, res) => {
    try {
        const { placa, tipo } = req.body;
        const celador_id = req.usuario.id;

        // 1. Buscar el vehículo por placa
        const [vehiculos] = await db.query(
            `SELECT v.*, u.nombre, u.email 
       FROM vehiculos v 
       JOIN usuarios u ON v.usuario_id = u.id 
       WHERE v.placa = ?`,
            [placa]
        );

        if (vehiculos.length === 0) {
            return res.status(404).json({ mensaje: 'Vehículo no encontrado' });
        }

        const vehiculo = vehiculos[0];

        // 2. Verificar el último registro del vehículo
        const [ultimoRegistro] = await db.query(
            'SELECT tipo FROM registros WHERE vehiculo_id = ? ORDER BY fecha DESC LIMIT 1',
            [vehiculo.id]
        );

        if (ultimoRegistro.length > 0) {
            const ultimoTipo = ultimoRegistro[0].tipo;

            // Si el último fue entrada y quiere registrar otra entrada
            if (ultimoTipo === 'entrada' && tipo === 'entrada') {
                return res.status(400).json({
                    mensaje: 'Este vehículo ya tiene una entrada activa. Debe registrar salida primero.'
                });
            }

            // Si el último fue salida y quiere registrar otra salida
            if (ultimoTipo === 'salida' && tipo === 'salida') {
                return res.status(400).json({
                    mensaje: 'Este vehículo ya registró salida. Debe registrar entrada primero.'
                });
            }
        }

        // 3. Registrar el movimiento
        await db.query(
            'INSERT INTO registros (vehiculo_id, celador_id, tipo, placa_referencia, propietario_referencia, marca_referencia, modelo_referencia) VALUES (?,?,?,?,?,?,?)',
            [vehiculo.id, celador_id, tipo, vehiculo.placa, vehiculo.nombre, vehiculo.marca, vehiculo.modelo]
        );

        res.status(201).json({
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
        const { placa, tipo, fecha_inicio, fecha_fin } = req.query;

        let condiciones = [];
        let valores = [];

        if (placa) {
            condiciones.push('(v.placa LIKE ? OR r.placa_referencia LIKE ?)');
            valores.push(`%${placa}%`, `%${placa}%`);
        }

        if (tipo) {
            condiciones.push('r.tipo = ?');
            valores.push(tipo);
        }

        if (fecha_inicio) {
            condiciones.push('r.fecha >= ?');
            valores.push(fecha_inicio)
        }

        if (fecha_fin) {
            condiciones.push('r.fecha <= ?');
            valores.push(fecha_fin + '23:59:59');
        }

        const where = condiciones.length > 0 ? 'WHERE ' + condiciones.join(' AND ') : '';
        const [registros] = await db.query(
            `SELECT r.id, r.tipo AS tipo_registro, r.fecha,
            COALESCE(v.placa, r.placa_referencia, '-') as placa,
            COALESCE(v.marca, r.marca_referencia, '-') as marca,
            COALESCE(v.modelo, r.modelo_referencia, '-') as modelo,
            COALESCE(u.nombre, r.propietario_referencia, '-') AS propietario,
            c.nombre AS celador
            FROM registros r 
            LEFT JOIN vehiculos v ON r.vehiculo_id = v.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            LEFT JOIN usuarios c ON r.celador_id = c.id
            ${where}
            ORDER BY r.fecha DESC`,
            valores
        );
        res.json(registros);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const eliminarRegistro = async (req, res) => {
    try {
        const { id } = req.params;
        const admin_id = req.usuario.id;

        const [registros] = await db.query(
            'SELECT * FROM registros WHERE id = ?', [id]
        );
        if (registros.length === 0) {
            return res.status(404).json({ mensaje: 'Registro no encontrado' });
        }

        // Guardar en papelera antes de eliminar
        await db.query(
            'INSERT INTO papelera (tabla_origen, datos, eliminado_por) VALUES (?, ?, ?)',
            ['registros', JSON.stringify(registros[0]), admin_id]
        );

        await db.query('DELETE FROM registros WHERE id = ?', [id]);
        res.json({ mensaje: 'Registro eliminado y guardado en papelera' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const getEstadisticas = async (req, res) => {
    try {
        // total de entradas hoy 
        const [entradasHoy] = await db.query(
            `SELECT COUNT(*) as total FROM registros
            WHERE tipo = 'entrada' AND DATE(fecha) = CURDATE()`
        );
        // total de salidas hoy 

        const [salidasHoy] = await db.query(
            `SELECT COUNT(*) as total FROM registros
            WHERE tipo = 'salida' AND DATE(fecha) = CURDATE()`
        );
        // Vehículos actualmente adentro
        const [adentro] = await db.query(
            `SELECT COUNT(*) as total FROM(
            SELECT vehiculo_id, tipo,
            ROW_NUMBER() OVER (PARTITION BY vehiculo_id ORDER BY fecha DESC) as rn
            FROM registros
            WHERE vehiculo_id IS NOT NULL)
            t WHERE rn = 1 AND tipo ='entrada'`
        );
        // Total usuarios registrados
        const [totalUsuarios] = await db.query(
            `SELECT COUNT(*) as total FROM usuarios WHERE role = 'user'`
        );
        // Total vehículos registrados
        const [totalVehiculos] = await db.query(
            `SELECT COUNT(*) as total FROM vehiculos`
        );

        const [porDia] = await db.query(
            `SELECT 
            DATE(fecha) as dia,
            SUM(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END) AS entrada,
            SUM(CASE WHEN tipo = 'salida' THEN 1 ELSE 0 END) AS salida
            FROM registros 
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
            GROUP BY DATE(fecha)
            ORDER BY dia ASC`
        );

        res.json({
            entradasHoy: entradasHoy[0].total,
            salidasHoy: salidasHoy[0].total,
            adentro: adentro[0].total,
            totalUsuarios: totalUsuarios[0].total,
            totalVehiculos: totalVehiculos[0].total,
            porDia
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

module.exports = { registrarMovimiento, verHistorial, eliminarRegistro, getEstadisticas };