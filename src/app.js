const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middlewares globales seguridad
app.use(helmet());
app.use(express.json());
app.use(cors());

// Rate limiting general
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { mensaje: 'Demasiadas peticiones. Intenta más tarde.' }
});

// Rate limiting estricto para login 
const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { mensaje: 'Demaciados intentos de login. Esperera 15 minutos.' }
});

app.use(limiterGeneral);
app.use('/auth/login', limiterLogin);

// Rutas
const authRoutes = require('./routes/authRoutes');
const vehiculosRoutes = require('./routes/vehiculosRoutes');
const registrosRoutes = require('./routes/registrosRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const visitantesRoutes = require('./routes/visitantesRoutes');
const parqueaderoRoutes = require('./routes/parqueaderoRoutes');
const logsRoutes = require('./routes/logsRoutes');

app.use('/auth', authRoutes);
app.use('/vehiculos', vehiculosRoutes);
app.use('/registros', registrosRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/visitantes', visitantesRoutes);
app.use('/parqueadero', parqueaderoRoutes);
app.use('/logs', logsRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'servidor parqueadero funcionando' });
});


// Limpieza automática de la papelera cada 24 horas
const limpiarPapelera = async () => {
  try {
    const db = require('./config/db');
    await db.query('DELETE FROM papelera WHERE fecha_expiracion < NOW()');
    console.log('🗑️ Papelera limpiada automáticamente');
  } catch (error) {
    console.error('Error limpiando papelera:', error);
  }
};

// Ejecuta la limpieza cada 24 horas
setInterval(limpiarPapelera, 24 * 60 * 60 * 1000);
limpiarPapelera(); // ejecuta al iniciar también

const limpiarIntentosExpirados = async () => {
  try {
    const db = require('./config/db')
    await db.query(
      'DELETE FROM intentos_login WHERE bloqueado_hasta < NOW() OR (bloqueado_hasta IS NULL AND ultimo_intento < DATE_SUB(NOW(), INTERVAL 1 HOUR))'
    );
    console.log('Intentos de login limpiados');
  } catch (error) {
    console.log('Error limpiando intentos:', error);
  }
};

setInterval(limpiarIntentosExpirados, 60 * 60 * 1000);
limpiarIntentosExpirados()

// Iniciar servidor - siempre al final
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`servidor corriendo en http://localhost:${PORT}`);
});