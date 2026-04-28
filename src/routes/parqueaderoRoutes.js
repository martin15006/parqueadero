const express = require('express');
const router = express.Router();
const { getEstadoParqueadero, actualizarConfiguracion, toogleParqueadero } = require('../controllers/parqueaderoController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.get('/estado', verificarToken, getEstadoParqueadero);
router.put('/configuracion', verificarToken, verificarRol('admin'), actualizarConfiguracion);
router.put('/toogle', verificarToken, verificarRol('admin'), toggleParqueadero);

module.exports = router;