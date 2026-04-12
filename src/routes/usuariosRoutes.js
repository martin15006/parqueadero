const express = require('express');
const router = express.Router();
const { getUsuarios, cambiarRol, getMiPerfil, actualizarPerfil,getTodosVehiculos,
    getPerfilUsuario, editarPerfilUsuario
 } = require('../controllers/usuariosController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, verificarRol('admin'), getUsuarios);
router.put('/:id/rol', verificarToken, verificarRol('admin'), cambiarRol);
router.get('/perfil', verificarToken, getMiPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.get('/vehiculos', verificarToken, verificarRol('admin'), getTodosVehiculos);
router.get('/:id/perfil', verificarToken, verificarRol('admin'), getPerfilUsuario);
router.put('/:id/perfil', verificarToken, verificarRol('admin'), editarPerfilUsuario);

module.exports = router;