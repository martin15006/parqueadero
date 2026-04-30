const db = require('../config/db');

const getEstadoParqueadero = async (req, res) => {
    try {
        const [config] = await db.query(`SELECT * FROM configuracion_parqueadero WHERE id = 1`);
        if (config.length === 0) return res.status(404).json({ mensaje: 'Configuracion no encontrada' });

        const cfg = config[0];

        // contar los vehiculos que estan adentro por tipo 
        const [adentroRegistrados] = await db.query(`
            SELECT v.tipo, COUNT(*) as total
            FROM registros r
            JOIN vehiculos v ON r.vehiculo_id = v.id
            WHERE r.tipo = 'entrada'
            AND r.vehiculo_id IN (
                SELECT vehiculo_id FROM(
                SELECT vehiculo_id, tipo,
                ROW_NUMBER() OVER(PARTITION BY vehiculo_id ORDER BY fecha DESC) as rn 
                FROM registros WHERE vehiculo_id IS NOT NULL
            )t WHERE rn = 1 AND tipo = 'entrada'
            )
            GROUP BY v.tipo
            `);

        const [adentroVisitantes] = await db.query(`
                SELECT tipo_vehiculo as tipo, COUNT(*) as total
                FROM visitantes
                WHERE estado = 'adentro'
                GROUP BY tipo_vehiculo
                `);

        // conteos 
        const ocupados = { carro: 0, moto: 0, otro: 0 };

        adentroRegistrados.forEach(r => {
            if (ocupados[r.tipo] !== undefined) ocupados[r.tipo] += Number(r.total);
        });

        adentroVisitantes.forEach(r => {
            const tipo = r.tipo === 'otro' ? 'otro' : r.tipo;
            if (ocupados[tipo] !== undefined) ocupados[tipo] += Number(r.total);
        });

        const disponibles = {
            carro: Math.max(0, cfg.espacios_carros - ocupados.carro),
            moto: Math.max(0, cfg.espacios_motos - ocupados.moto),
            otro: Math.max(0, cfg.espacios_otros - ocupados.otro),
        };

        res.json({
            parqueadero_activo: cfg.parqueadero_activo,
            motivo_cierre: cfg.motivo_cierre,
            capacidad: {
                carro: cfg.espacios_carros,
                motos: cfg.espacios_motos,
                otros: cfg.espacios_otros,
            },
            ocupados,
            disponibles,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const actualizarConfiguracion = async (req, res) => {
    try {
        const { espacios_carros, espacios_motos, espacios_otros } = req.body;

        const updates = [];
        const valores = [];

        if (espacios_carros !== undefined && espacios_carros !== '') {
            updates.push('espacios_carros = ?');
            valores.push(parseInt(espacios_carros));
        }

        if (espacios_motos !== undefined && espacios_motos !== '') {
            updates.push('espacios_motos = ?');
            valores.push(parseInt(espacios_motos));
        }

        if (espacios_otros !== undefined && espacios_otros !== '') {
            updates.push('espacios_otros = ?');
            valores.push(parseInt(espacios_otros));
        }

        if (updates.length === 0) {
            return res.status(400).json({ mensaje: 'No hay cambios para guardar' });
        }
        valores.push(1);
        await db.query(`UPDATE configuracion_parqueadero SET ${updates.join(', ')} WHERE id = ?`, valores);
        res.json({ mensaje: 'Configuracion actualizada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const toggleParqueadero = async (req, res) => {
    try {
        const { activo, motivo_cierre } = req.body;
        await db.query(
            `UPDATE configuracion_parqueadero SET parqueadero_activo = ?, motivo_cierre = ? WHERE id = 1`,
            [activo, activo ? null : motivo_cierre]
        );
        res.json({ mensaje: activo ? 'Parqueadero habilitado' : 'Parqueadero desabilitado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

module.exports = { getEstadoParqueadero, actualizarConfiguracion, toggleParqueadero };