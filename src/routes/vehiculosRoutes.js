const express = require('express');
const router = express.Router();
const { crearVehiculo, misVehiculos, buscarPorPlaca, eliminarVehiculo } = require('../controllers/vehiculosController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// cualquier usuario autenticado puede registrar su vehículo
router.post('/', verificarToken, crearVehiculo);

// ver mis vehiculos 
router.get('/mis-vehiculos', verificarToken, misVehiculos);

// para los celadores y administradores
router.get('/buscar/:placa', verificarToken, verificarRol('admin', 'celador'), buscarPorPlaca);

router.delete('/:id', verificarToken, eliminarVehiculo);
module.exports = router;