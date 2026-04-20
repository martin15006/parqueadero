CREATE DATABASE IF NOT EXISTS parqueadero;
USE parqueadero;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  cedula VARCHAR(20) UNIQUE,
  telefono VARCHAR(20),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'celador', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  placa VARCHAR(20) UNIQUE NOT NULL,
  marca VARCHAR(50),
  modelo VARCHAR(50),
  color VARCHAR(100),
  tipo ENUM('carro', 'moto') DEFAULT 'carro',
  usuario_id INT NOT NULL,
  qr_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de registros de entrada/salida
CREATE TABLE IF NOT EXISTS registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id INT NULL,
  celador_id INT,
  tipo ENUM('entrada', 'salida') NOT NULL,
  placa_referencia VARCHAR(20) NULL,
  propietario_referencia VARCHAR(100) NULL,
  marca_referencia VARCHAR(50) NULL,
  modelo_referencia VARCHAR(50) NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX (vehiculo_id),
  INDEX (celador_id),
  
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL,
  FOREIGN KEY (celador_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de papelera (respaldo de elementos eliminados)
CREATE TABLE IF NOT EXISTS papelera (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tabla_origen VARCHAR(50) NOT NULL,
  datos JSON NOT NULL,
  eliminado_por INT,
  fecha_eliminacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 30 DAY),
  FOREIGN KEY (eliminado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de intentos de login fallidos
CREATE TABLE IF NOT EXISTS intentos_login (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  intentos INT DEFAULT 1,
  ultimo_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  bloqueado_hasta TIMESTAMP NULL
);

-- Tabla de visitantes temporales
CREATE TABLE IF NOT EXISTS visitantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  documento VARCHAR(20),
  telefono VARCHAR(20),
  correo VARCHAR(255),
  tipo_vehiculo ENUM('carro', 'moto', 'otro') DEFAULT 'carro',
  placa VARCHAR(20),
  marca VARCHAR(50),
  modelo VARCHAR(50),
  color VARCHAR(100),
  descripcion TEXT,
  registrado_por INT,
  estado ENUM('adentro', 'afuera', 'pendiente') DEFAULT 'pendiente',
  fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_salida TIMESTAMP NULL,
  qr_temporal TEXT,
  qr_usado TINYINT(1) DEFAULT 0,
  celador_entrada_id INT NULL,
  celador_salida_id INT NULL,
  hora_entrada_real TIMESTAMP NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (celador_entrada_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (celador_salida_id) REFERENCES usuarios(id) ON DELETE SET NULL
);