const db = require('../config/db');

const getLogs = async (req, res) => {
    try {
        const { accion, tipo, fecha_inicio, fecha_fin, usuario, limit = 500 } = req.query;

        let condiciones = [];
        let valores = [];

        if (accion) {
            condiciones.push('l.accion LIKE ?');
            valores.push(`%${accion}%`);          // FIX: % en ambos lados
        }

        if (tipo) {
            condiciones.push('l.tipo = ?');
            valores.push(tipo);                   //  FIX: faltaba agregar el valor
        }

        if (usuario) {
            condiciones.push('l.usuario_nombre LIKE ?');
            valores.push(`%${usuario}%`);         //  FIX: % en ambos lados (consistencia)
        }

        if (fecha_inicio) {
            condiciones.push('l.fecha >= ?');
            valores.push(fecha_inicio);
        }

        if (fecha_fin) {
            condiciones.push('l.fecha <= ?');
            valores.push(`${fecha_fin} 23:59:59`);
        }

        const where = condiciones.length > 0 ? 'WHERE ' + condiciones.join(' AND ') : '';
        valores.push(parseInt(limit));

        const [logs] = await db.query(
            `SELECT * FROM logs_auditoria l ${where} ORDER BY l.fecha DESC LIMIT ?`,
            valores
        );

        res.json(logs);
    } catch (error) {
        console.error('[getLogs]', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const getEstadisticasLogs = async (req, res) => {
    try {
        const [totalHoy] = await db.query(
            `SELECT COUNT(*) as total FROM logs_auditoria WHERE DATE(fecha) = CURDATE()`
        );

        const [loginsExitosos] = await db.query(
            `SELECT COUNT(*) as total FROM logs_auditoria
            WHERE accion = 'LOGIN_EXITOSO' AND DATE(fecha) = CURDATE()`
        );

        const [loginsFallidos] = await db.query(
            `SELECT COUNT(*) as total FROM logs_auditoria
            WHERE accion = 'LOGIN_FALLIDO' AND DATE(fecha) = CURDATE()`
        );

        const [accionesCriticas] = await db.query(
            `SELECT COUNT(*) as total FROM logs_auditoria
            WHERE tipo = 'critico' AND DATE(fecha) = CURDATE()`
        );

        const [errores] = await db.query(
            `SELECT COUNT(*) as total FROM logs_auditoria
            WHERE tipo = 'error' AND DATE(fecha) = CURDATE()`
        );

        const [porTipo] = await db.query(
            `SELECT tipo, COUNT(*) as total FROM logs_auditoria
            WHERE DATE(fecha) = CURDATE() GROUP BY tipo`
        );

        const [porDia] = await db.query(
            `SELECT DATE(fecha) as dia, COUNT(*) as total
            FROM logs_auditoria
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(fecha) ORDER BY dia ASC`
        );

        res.json({
            totalHoy:         totalHoy[0].total,
            loginsExitosos:   loginsExitosos[0].total,
            loginsFallidos:   loginsFallidos[0].total,
            accionesCriticas: accionesCriticas[0].total,
            errores:          errores[0].total,
            porTipo,
            porDia,
        });
    } catch (error) {
        console.error('[getEstadisticasLogs]', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

module.exports = { getLogs, getEstadisticasLogs };