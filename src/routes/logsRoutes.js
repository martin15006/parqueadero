const express = require('express');
const router = express.Router();
const { getLogs, getEstadisticasLogs } = require('../controllers/logsController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, verificarRol('admin'), getLogs);
router.get('/estadisticas', verificarToken, verificarRol('admin'), getEstadisticasLogs);

module.exports = router;