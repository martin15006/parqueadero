const express = require('express');
const router = express.Router();
const { registrarMovimiento, verHistorial } = require('../controllers/registrosController');
const {verificarToken, verificarRol} = require('../middlewares/authMiddleware');

// celador y admin pueden registrar los movimientos

router.post('/', verificarToken, verificarRol('admin','celador'), registrarMovimiento);

// solo el admin ve el historial completo
router.get('/', verificarToken, verificarRol('admin'),verHistorial);

module.exports = router;