#  Sistema de Gestión de Parqueadero

Sistema web para el control de entradas y salidas de vehículos mediante código QR. Desarrollado con Node.js, Express, MySQL y React.

---

##  Funcionalidades

-  Autenticación JWT con bloqueo por intentos fallidos
-  Registro de vehículos con generación automática de QR
-  Escáner QR desde cámara del celular (requiere HTTPS)
-  Módulo de visitantes con QR temporal de un solo uso
-  Panel administrativo con estadísticas y gráficas
-  Logs de auditoría completos con exportación
-  Exportación de reportes en Excel y PDF
-  Control de capacidad por tipo de vehículo
-  Modo oscuro /  Modo claro
-  Diseño responsivo para móvil y escritorio
-  Rate limiting, Helmet y CORS configurado

---

##  Tecnologías

**Backend:** Node.js, Express, MySQL, JWT, bcrypt, QRCode, Helmet, express-rate-limit

**Frontend:** React, Vite, Axios, Recharts, jsPDF, ExcelJS, html5-qrcode

---

##  Estructura del Proyecto

```
parqueadero/             
    controllers/
    routes/
    middlewares/
    utils/
    config/
  app.js
  .env
  database.sql

parqueadero-frontend/       
  public/
    sound1-5.mp3
  src/
    pages/
    components/
    api/
  index.css
```

---

##  Instalación Backend

### 1. Requisitos previos
- Node.js v18 o superior
- MySQL (XAMPP recomendado para desarrollo local)

### 2. Instalar dependencias

```bash
cd parqueadero
npm install
```

### 3. Crear archivo `.env`

Crea un archivo llamado `.env` en la raíz del backend con el siguiente contenido:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_de_mysql
DB_NAME=parqueadero
JWT_SECRET=una_clave_secreta_larga_y_segura_min32caracteres
PORT=3000
```

>  **Importante:** Nunca subas el archivo `.env` a GitHub. Ya está incluido en `.gitignore`.

### 4. Importar la base de datos

Abre phpMyAdmin o ejecuta en consola:

```bash
mysql -u root -p < database.sql
```

O copia el contenido de `database.sql` y ejecútalo directamente en phpMyAdmin.

### 5. Iniciar el servidor

```bash
npm run dev
```

El servidor quedará corriendo en `http://localhost:3000`

---

##  Instalación Frontend

### 1. Instalar dependencias

```bash
cd parqueadero-frontend
npm install
```

### 2. Configurar la IP del backend

Abre `src/api/axios.js` y cambia la `baseURL` por la IP de tu computador:

```javascript
baseURL: 'http://TU_IP_LOCAL:3000',
```

Para conocer tu IP local ejecuta `ipconfig` en Windows o `ifconfig` en Mac/Linux.

### 3. Iniciar el frontend

```bash
npm run dev
```

El frontend quedará disponible en `http://localhost:5173`

---

##  Cámara QR en celular (ngrok)

La cámara del celular requiere HTTPS. Para habilitarla en desarrollo:

```bash
# Instalar ngrok si no lo tienes
npm install -g ngrok

# Exponer el frontend por HTTPS
ngrok http 5173
```

Usa la URL `https://...ngrok-free.app` que genera para acceder desde el celular. El backend sigue corriendo por IP local.

---

##  Roles del Sistema

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso total — usuarios, vehículos, historial, visitantes, logs, configuración, salida de emergencia |
| **celador** | Registrar entradas/salidas, escanear QR, buscar por placa, ver parqueadero |
| **user** | Registrar sus vehículos, ver su QR, consultar su historial |

---

## Rutas del Sistema

| Ruta | Acceso |
|------|--------|
| `/` y `/landing` | Público |
| `/login` | Público |
| `/register` | Público |
| `/dashboard` | Todos los autenticados |
| `/admin` | Solo admin |
| `/celador` | Admin y celador |
| `/perfil` | Todos los autenticados |
| `/mi-historial` | Todos los autenticados |
| `/parqueadero` | Todos los autenticados |
| `/visitantes` | Solo admin |
| `/logs` | Solo admin |
| `/configuracion` | Todos los autenticados |

---

##  Seguridad Implementada

- Contraseñas encriptadas con **bcrypt**
- Tokens **JWT** con expiración de 24 horas
- Bloqueo de cuenta tras **5 intentos fallidos** (15 minutos)
- **Rate limiting** — 200 peticiones/15min general, 15 en login
- **Helmet** — cabeceras de seguridad HTTP
- **CORS** restringido a orígenes autorizados
- Consultas parametrizadas — protección contra **SQL Injection**
- **Logs de auditoría** con registro de IP para todas las acciones críticas
- Papelera con retención de **30 días** antes de eliminación definitiva
- Logs automáticamente eliminados después de **90 días**

---

##  Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Host de la base de datos | `localhost` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASSWORD` | Contraseña MySQL | `tu_password` |
| `DB_NAME` | Nombre de la base de datos | `parqueadero` |
| `JWT_SECRET` | Clave secreta para JWT | `clave_larga_segura` |
| `PORT` | Puerto del servidor | `3000` |

---

##  Scripts disponibles

**Backend:**
```bash
npm run dev      # Inicia con nodemon (desarrollo)
npm start        # Inicia sin nodemon (producción)
```

**Frontend:**
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa del build
```

---

##  Pendiente (requiere servicios externos)

- **Recuperación de contraseña** por email — requiere nodemailer o SendGrid
- **Verificación de cuenta** por SMS — requiere Twilio
- **HTTPS en backend** — se configura automáticamente al subir a producción con dominio propio

---

##  Autor

Desarrollado por **Martincito** — Proyecto SENA