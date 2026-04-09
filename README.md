# Sistema de Parqueadero

## Requisitos
- Node.js v18+
- MySQL

## Instalación Backend
```bash
cd parqueadero
npm install
```

Crea un archivo `.env` con:

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=parqueadero
JWT_SECRET=tu_clave_secreta
PORT=3000
Importa la base de datos:

```bash
mysql -u root -p < database.sql
```

Inicia el servidor:
```bash
npm run dev
```

## Instalación Frontend
```bash
cd parqueadero-frontend
npm install
npm run dev
```

## Roles
- **admin** — gestión completa
- **celador** — registrar entradas y salidas
- **user** — registrar vehículos y ver QR