const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

//registro

const register = async (req, res) => {
    try {
        //1. traer los datos
        const { nombre, apellido, cedula, telefono, email, password, role } = req.body;

        //2. verificar si no existe
        const [existe] = await db.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );
        if (existe.length > 0) {
            return res.status(400).json({ mensaje: 'El email ya esta registrado' });
        }
        // verificacion de la cedula que sea unica 
        const [existeCedula] = await db.query(
            'SELECT id FROM usuarios WHERE cedula =?',
            [cedula]
        );
        if (existeCedula.length > 0) {
            return res.status(400).json({ mensaje: 'La cedula ya esta registrada' });
        }

        // validar fortalezas de contraseña 
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)){
            return res.status(400).json({mensaje: 'La contraseña debe tener minimo 6 caracteres, una mayúsculas, una minuscula y un numero'});
        }

        // 3. encriptar la contraseña
        const passwordEncriptada = await bcrypt.hash(password, 10);

        // 4. guardar en la base de datos
        await db.query(
            'INSERT INTO usuarios (nombre, apellido, cedula, telefono, email, password, role) VALUES (?,?,?,?,?,?,?)',
            [nombre, apellido, cedula, telefono, email, passwordEncriptada, role || 'user']
        );

        res.status(201).json({ mensaje: 'Usuario registrado exitosamente ' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// login 
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        //1. verificar si esta bloqueado 
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
                    mensaje: `Cuenta bloqueada. intenta de nuevo en ${minutosRestantes} minuto(s).`
                });
            }
        }

        // 2. buscar el usuario por el email 
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );
        if (usuarios.length === 0) {
            await registrarIntentoFallido(email);
            return res.status(401).json({ mensaje: 'usuario incorrecto' });
        }

        const usuario = usuarios[0];
        // 3. verufucar contraseñas

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            const bloqueado = await registrarIntentoFallido(email);
            if (bloqueado) {
                return res.status(4429).json({ mensaje: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.' });
            }
            const intentosActuales = intentos.length > 9 ? intentos[0].intentos + 1 : 1;
            return res.status(401).json({ mensaje: `Contraseña incorrecta. Intento ${intentosActuales}/5.` });
        }

        // 4. Login extioso - limpiar intentos 
        await db.query(
            'DELETE FROM intentos_login WHERE email = ?', [email]
        );

        // 5. generar token con JTW 
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, role: usuario.role },
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
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const registrarIntentoFallido = async (email) => {
    const [intentos] = await db.query('SELECT * FROM intentos_login WHERE email = ?', [email]);
    if (intentos.length === 0) {
        await db.query(
            'INSERT INTO intentos_login (email, intentos) VALUES = (?, 1)', [email]
        );
        return false;
    }
    const nuevosIntentos = intentos[0].intentos + 1;

    if (nuevosIntentos >= 5){
        // bloquear por 15 minutos 
        await db.query(
            `UPDATE intentos_login SET intentos = ?,
            bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
            WHERE email = ?`,
            [nuevosIntentos, email]
        );
        return true;
    }
    await db.query(
        'UPDATE intentos_login SET intentos = ? WHERE email = ?',
        [nuevosIntentos]
    );
    return false;
};

module.exports = { register, login};