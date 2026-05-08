const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { registrarLog } = require('../utils/logger');

// ── Registro ──

const register = async (req, res) => {
    try {
        const { nombre, apellido, cedula, telefono, email, password, role } = req.body;

        const [existe] = await db.query(
            'SELECT id FROM usuarios WHERE email = ?', [email]
        );
        if (existe.length > 0) {
            return res.status(400).json({ mensaje: 'El email ya esta registrado' });
        }

        const [existeCedula] = await db.query(
            'SELECT id FROM usuarios WHERE cedula = ?', [cedula]
        );
        if (existeCedula.length > 0) {
            return res.status(400).json({ mensaje: 'La cedula ya esta registrada' });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener mínimo 6 caracteres, una mayúscula, una minúscula y un número'
            });
        }

        const passwordEncriptada = await bcrypt.hash(password, 10);

        const [resultado] = await db.query(
            'INSERT INTO usuarios (nombre, apellido, cedula, telefono, email, password, role) VALUES (?,?,?,?,?,?,?)',
            [nombre, apellido, cedula, telefono, email, passwordEncriptada, role || 'user']
        );

        await registrarLog({
            usuario_id: resultado.insertId,
            usuario_nombre: nombre,
            usuario_role: role || 'user',
            accion: 'REGISTRO_USUARIO',
            descripcion: `Nuevo usuario registrado: ${nombre} ${apellido}`,
            ip: req.ip,
            tipo: 'info',
        });

        res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });

    } catch (error) {
        console.error('[register]', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// ── Login ──

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Verificar si está bloqueado
        const [intentos] = await db.query(
            'SELECT * FROM intentos_login WHERE email = ?', [email]
        );

        if (intentos.length > 0) {
            const intento = intentos[0];
            if (intento.bloqueado_hasta && new Date(intento.bloqueado_hasta) > new Date()) {
                const minutosRestantes = Math.ceil(
                    (new Date(intento.bloqueado_hasta) - new Date()) / 60000
                );
                return res.status(429).json({
                    mensaje: `Cuenta bloqueada. Intenta de nuevo en ${minutosRestantes} minuto(s).`
                });
            }
        }

        // 2. Buscar usuario
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE email = ?', [email]
        );

        if (usuarios.length === 0) {
            // ✅ FIX: registrar log aunque el usuario no exista
            await registrarLog({
                accion: 'LOGIN_FALLIDO',
                descripcion: `Intento de login con email no registrado: ${email}`,
                ip: req.ip,
                tipo: 'error',
            });
            await registrarIntentoFallido(email);
            return res.status(401).json({ mensaje: 'Usuario incorrecto' });
        }

        const usuario = usuarios[0];

        // 3. Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password);

        // ✅ Así debe quedar
        if (!passwordValida) {
            await registrarLog({
                usuario_id: usuario.id,
                usuario_nombre: usuario.nombre,
                usuario_role: usuario.role,
                accion: 'LOGIN_FALLIDO',
                descripcion: `Intento fallido de login para ${email}`,
                ip: req.ip,
                tipo: 'error',
            });

            const bloqueado = await registrarIntentoFallido(email);
            if (bloqueado) {
                return res.status(429).json({
                    mensaje: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.'
                });
            }

            const intentosActuales = intentos.length > 0 ? intentos[0].intentos + 1 : 1;
            return res.status(401).json({
                mensaje: `Contraseña incorrecta. Intento ${intentosActuales}/5.`
            });
        }

        // 4. Login exitoso — limpiar intentos
        await db.query('DELETE FROM intentos_login WHERE email = ?', [email]);

        await registrarLog({
            usuario_id: usuario.id,
            usuario_nombre: usuario.nombre,
            usuario_role: usuario.role,
            accion: 'LOGIN_EXITOSO',
            descripcion: `${usuario.nombre} inició sesión`,
            ip: req.ip,
            tipo: 'exito',
        });

        // 5. Generar token JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                role: usuario.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                cedula: usuario.cedula,
                telefono: usuario.telefono,
                email: usuario.email,
                role: usuario.role,
            },
        });

    } catch (error) {
        console.error('[login]', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// ── Intentos fallidos ──

const registrarIntentoFallido = async (email) => {
    const [intentos] = await db.query(
        'SELECT * FROM intentos_login WHERE email = ?', [email]
    );

    if (intentos.length === 0) {
        await db.query(
            'INSERT INTO intentos_login (email, intentos) VALUES (?, 1)', [email]
        );
        return false;
    }

    const nuevosIntentos = intentos[0].intentos + 1;

    if (nuevosIntentos >= 5) {
        await db.query(
            `UPDATE intentos_login
             SET intentos = ?, bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
             WHERE email = ?`,
            [nuevosIntentos, email]
        );
        return true;
    }

    await db.query(
        'UPDATE intentos_login SET intentos = ? WHERE email = ?',
        [nuevosIntentos, email]
    );
    return false;
};

module.exports = { register, login };