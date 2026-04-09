const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers && req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ mensaje: 'toquen requerido' });
    }

    // verifiva que el token sea valido
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(403).json({ mensaje: 'token invalido o expirado' });
        }
        req.usuario = payload;
        next(); //continua al controller
    });
};

const verificarRol = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.usuario.role)) {
            return res.status(403).json({ mensaje: 'no tiene permiso para realizar esta accion' });
        }
        next();
    };
};


module.exports = { verificarToken, verificarRol };