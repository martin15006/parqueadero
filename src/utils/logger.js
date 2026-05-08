const db = require('../config/db');

const registrarLog = async ({
    usuario_id = null,
    usuario_nombre = null,
    usuario_role = null,
    accion,
    descripcion,
    datos_anteriores = null,
    datos_nuevos = null,
    ip = null,
    tipo = 'info'
}) => {
    try {
        await db.query(
            `INSERT INTO logs_auditoria
            (usuario_id, usuario_nombre, usuario_role,accion,
            descripcion, datos_anteriores, datos_nuevos, ip, tipo)
            VALUES(?,?,?,?,?,?,?,?,?)`,
            [
                usuario_id,
                usuario_nombre,
                usuario_role,
                accion,
                descripcion,
                datos_anteriores ? JSON.stringify(datos_anteriores) : null,
                datos_nuevos ? JSON.stringify(datos_nuevos) : null,
                ip,
                tipo
            ]
        );
    } catch (error) {
        console.error('Error guardando log:', error);
    }
};

module.exports = { registrarLog };