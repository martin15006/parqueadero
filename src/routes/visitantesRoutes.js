const express = require('express');
const router = express.Router();
const { registrarVisitantes, getVisitantes, registrarEntradaVisitante, registrarSalidaVisitante, buscarVisitantePorPlaca, registrarEntradaById, buscarVisitantePorNombre, eliminarVisitante } = require('../controllers/visitantesController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// el admin puede registrar a los visitantes y verlos 
router.post('/', verificarToken, verificarRol('admin'), registrarVisitantes);
router.get('/', verificarToken, verificarRol('admin'), getVisitantes);
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarVisitante);

// celador y admin pueden registrar entradas y salidas de visitantes 
router.post('/entrada-qr', verificarToken, verificarRol('admin', 'celador'), registrarEntradaVisitante);
router.get('/buscar/:placa', verificarToken, verificarRol('admin', 'celador'), buscarVisitantePorPlaca);
router.get('/buscar-nombre/:nombre', verificarToken, verificarRol('admin', 'celador'), buscarVisitantePorNombre)
router.put('/:id/salida', verificarToken, verificarRol('admin', 'celador'), registrarSalidaVisitante);
router.put('/:id/entrada', verificarToken, verificarRol('admin', 'celador'), registrarEntradaById);


module.exports = router;