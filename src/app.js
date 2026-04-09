const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globales
app.use(express.json());
app.use(cors());

// Rutas
const authRoutes = require('./routes/authRoutes');
const vehiculosRoutes = require('./routes/vehiculosRoutes');
const registrosRoutes = require('./routes/registrosRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');

app.use('/auth', authRoutes);
app.use('/vehiculos', vehiculosRoutes);
app.use('/registros', registrosRoutes);
app.use('/usuarios', usuariosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'servidor parqueadero funcionando' });
});

// Iniciar servidor - siempre al final
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`servidor corriendo en http://localhost:${PORT}`);
});