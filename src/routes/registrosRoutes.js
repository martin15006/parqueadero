const express = require('express');
const router = express.Router();
const { registrarMovimiento, verHistorial,eliminarRegistro, getEstadisticas, getHistorialUsuario, registrarSalidaEmergencia } = require('../controllers/registrosController');
const {verificarToken, verificarRol} = require('../middlewares/authMiddleware');

// celador y admin pueden registrar los movimientos

router.post('/', verificarToken, verificarRol('admin','celador'), registrarMovimiento);

router.post('/emergencia', verificarToken, verificarRol('admin'), registrarSalidaEmergencia)

// solo el admin ve el historial completo
router.get('/', verificarToken, verificarRol('admin'),verHistorial);

// eliminar registros solo lo hace los administradores 
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarRegistro);

// estadisticas 
router.get('/estadisticas', verificarToken, verificarRol('admin'), getEstadisticas);

// historial usuario 
router.get('/mi-historial', verificarToken, getHistorialUsuario);

module.exports = router;