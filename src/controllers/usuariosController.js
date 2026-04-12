const db = require('../config/db');
const bcrypt = require('bcrypt');

const getUsuarios = async (req, res) => {
    try {
        const [usuarios] = await db.query(
            'SELECT id, nombre, email, role, created_at FROM usuarios'
        );
        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' })
    }
};

const cambiarRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'celador', 'user'].includes(role)) {
            return res.status(400).json({ mensaje: 'Rol invalido' });
        }
        await db.query('UPDATE usuarios SET role = ? WHERE id = ?', [role, id]);
        res.json({ mensaje: 'Rol actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' })
    }
};

const actualizarPerfil = async (req, res) => {
    try {
        const id = req.usuario.id;
        const { nombre, apellido, telefono, passwordActual, passwordNueva } = req.body;

        // verificar el usuario y obtener su contraseña 
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
        if (usuarios.length === 0) {
            return res.status(400).json({ mensaje: 'usuario no encontrado' });
        }
        const usuario = usuarios[0];

        // verificar contraseña actual antes de cambiarla        
        // si quiere cambiar la contrasea se encripta la nueva 
        let passwordFinal = usuario.password;

        if (passwordNueva) {
            if (!passwordActual) {
                return res.status(400).json({ mensaje: 'Debes ingresar la contraseña actual' });
            }

            const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
            if (!passwordValida) {
                return res.status(401).json({ mensaje: 'contraseña actual incorrecta' });
            }

            if (passwordNueva.length < 6) {
                return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
            }

            passwordFinal = await bcrypt.hash(passwordNueva, 10);
        }

        // actualizar datos
        await db.query(
            'UPDATE usuarios SET nombre =?, apellido=?, telefono=?, password=? WHERE id=?',
            [nombre, apellido, telefono, passwordFinal, id]
        );
        res.json({ mensaje: 'Perfil actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};
const getMiPerfil = async (req, res) => {
    try {
        const id = req.usuario.id;
        const [usuarios] = await db.query(
            'SELECT id, nombre, apellido, cedula, telefono, email, role, created_at FROM usuarios WHERE id = ?',
            [id]
        );
        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.json(usuarios[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' })
    }
};

const getTodosVehiculos = async (req, res) => {
    try {
        const [vehiculos] = await db.query(
            `SELECT v.id, v.placa, v.marca, v.modelo, v.color, v.tipo,
            u.nombre, u.email
            FROM vehiculos v
            JOIN usuarios u ON v.usuario_id = u.id
            ORDER BY v.created_at DESC`
        );
        res.json(vehiculos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const getPerfilUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const [usuarios] = await db.query(
            'SELECT id, nombre, apellido, cedula, telefono, email, role, created_at FROM usuarios WHERE id = ?',
            [id]
        );
        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.json(usuarios[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const editarPerfilUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, telefono, email, passwordNueva, passwordAdmin } = req.body
        const adminId = req.usuario.id;

        // verificar contraseña al admin 
        const [admins] = await db.query(
            'SELECT * FROM usuarios WHERE id = ?', [adminId]
        );
        const adminValido = await bcrypt.compare(passwordAdmin, admins[0].password);
        if (!adminValido) {
            return res.status(401).json({ mensaje: 'Contraseña de administrador incorrecta' });
        }
        // verificar que el usuario existe 
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE id = ?', [id]
        );
        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // verificar el email unico si se llega a cambiar 
        if (email && email !== usuarios[0].email) {
            const [emailExiste] = await db.query(
                'SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, id]
            );
            if (emailExiste.length > 0) {
                return res.status(400).json({ mensaje: 'El email ya esta en uso' });
            }
        }

        // preparar nueva contraseña 
        let passwordFinal = usuarios[0].password;
        if (passwordNueva && passwordNueva.length >= 6) {
            passwordFinal = await bcrypt.hash(passwordNueva, 10);
        }
        await db.query(
            'UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, email = ?,password = ? WHERE id = ?',
            [
                nombre || usuarios[0].nombre,
                apellido || usuarios[0].apellido,
                telefono || usuarios[0].telefono,
                email || usuarios[0].email,
                passwordFinal,
                id
            ]
        );
        res.json({ mensaje: 'Perfil actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

module.exports = { getUsuarios, cambiarRol, getMiPerfil, actualizarPerfil, getTodosVehiculos, getPerfilUsuario,editarPerfilUsuario };