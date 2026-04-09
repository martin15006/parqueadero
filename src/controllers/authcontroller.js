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
        if (existeCedula.length >0){
            return res.status(400).json({mensaje: 'La cedula ya esta registrada'});
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

        // 1. buscar el usuario por el email 
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );
        if (usuarios.length === 0) {
            return res.status(401).json({ mensaje: 'usuario incorrecto' });
        }

        const usuario = usuarios[0];
        // 2. comparar contraseñas usando el hash 

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ mensaje: 'los credenciales son incorrectos' });
        }

        // 3. generar token con JTW 
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

module.exports = { register, login };