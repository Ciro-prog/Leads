# CRM Leads Médicos - Sistema de Gestión de Leads

Sistema CRM para gestionar leads fríos de clínicas y centros estéticos con 14 vendedores remotos.

## 🚀 Características

- **Autenticación JWT** con roles (Admin/Vendedor)
- **Gestión de Leads** con estados y seguimiento
- **Importación CSV** con validación y limpieza automática
- **Asignación flexible** de leads a vendedores
- **Dashboard responsive** optimizado para móvil
- **Reportes y estadísticas** en tiempo real

## 📋 Requisitos

- Node.js 16+
- MongoDB 4.4+
- npm o yarn

## 🛠️ Instalación

### 1. Clonar y configurar proyecto

```bash
cd crm-leads
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/leads
JWT_SECRET=tu_clave_secreta_super_segura_aqui_123456
NODE_ENV=development
```

### 3. Inicializar base de datos

```bash
# Crear datos de ejemplo (admin + vendedores + leads)
npm run seed
```

### 4. Ejecutar servidor

```bash
# Modo desarrollo con nodemon
npm run dev

# Modo producción
npm start
```

## 🔐 Credenciales por Defecto

**Administrador:**
- Usuario: `admin`
- Email: `admin@crm-leads.com`
- Contraseña: `admin123`

**Vendedores de Ejemplo:**
- Usuario: `vendedor1` / Contraseña: `vendedor123`
- Usuario: `vendedor2` / Contraseña: `vendedor123`  
- Usuario: `vendedor3` / Contraseña: `vendedor123`

> ⚠️ **IMPORTANTE:** Cambiar contraseñas en producción

## 📱 Uso del Sistema

### Panel Administrador

1. **Dashboard**: Estadísticas generales y KPIs
2. **Gestión de Leads**: 
   - Importar CSV con validación automática
   - Asignar leads a vendedores
   - Ver pipeline completo
3. **Gestión de Vendedores**:
   - Crear/editar vendedores
   - Ver estadísticas de performance
   - Activar/desactivar usuarios
4. **Reportes**: Exportar datos y métricas

### Panel Vendedor

1. **Mis Leads**: Lista de leads asignados con filtros
2. **Actualización rápida**: Cambiar estado y agregar notas
3. **Seguimiento**: Programar próximas acciones
4. **Historial**: Ver todas las interacciones

## 🗄️ Estructura de Base de Datos

### Colecciones MongoDB

- **users**: Usuarios (admin/vendedores)
- **leads**: Leads con estados y seguimiento
- **importhistories**: Historial de importaciones CSV

### Estados de Lead

- `uncontacted`: Sin contactar (🔴)
- `contacted`: Contactado (🟡)  
- `interested`: Interesado (🔵)
- `meeting`: Reunión programada (🟣)
- `won`: Ganado (🟢)
- `lost`: Perdido (⚫)

## 🔄 API Endpoints

### Autenticación
```
POST /api/auth/login       # Iniciar sesión
POST /api/auth/logout      # Cerrar sesión  
GET  /api/auth/me          # Usuario actual
PUT  /api/auth/change-password # Cambiar contraseña
```

### Leads
```
GET    /api/leads          # Listar leads (con filtros)
GET    /api/leads/:id      # Lead específico
POST   /api/leads          # Crear lead (admin)
PUT    /api/leads/:id      # Actualizar lead
PUT    /api/leads/:id/status # Actualizar estado (móvil)
POST   /api/leads/assign   # Asignar leads (admin)
DELETE /api/leads/:id      # Eliminar lead (admin)
```

### Usuarios
```
GET    /api/users          # Listar usuarios (admin)
GET    /api/users/sellers  # Solo vendedores
POST   /api/users          # Crear usuario (admin)
PUT    /api/users/:id      # Actualizar usuario (admin)
DELETE /api/users/:id      # Eliminar usuario (admin)
GET    /api/users/stats/dashboard # Stats dashboard (admin)
```

### Importación
```
POST /api/import/upload    # Subir CSV para preview (admin)
POST /api/import/process   # Procesar CSV con mapeo (admin)
GET  /api/import/history   # Historial de importaciones (admin)
GET  /api/import/:id       # Detalles de importación (admin)
```

## 📊 Importación de CSV

### Formato Esperado

El sistema acepta CSV con las siguientes columnas (configurables):

```csv
Nombre,Contacto,Teléfono,Dirección,Sitio Web,Tipo,Valoración
"Clínica Dental Sonrisa","Dr. Juan Pérez","+54 11 1234-5678","Av. Corrientes 1234","clinicasonrisa.com.ar","Clínica Dental","4.5"
```

### Validaciones Automáticas

- ✅ **Elimina duplicados** (por teléfono + nombre)
- ✅ **Valida campos requeridos** (nombre, teléfono, website)
- ✅ **Limpia URLs** (extrae dominio de Google Ads)
- ✅ **Formatea teléfonos** (remueve caracteres especiales)
- ✅ **Genera estadísticas** de limpieza

## 🎨 Interfaz Mobile-First

### Responsive Design

- **Mobile**: 320px-768px (prioridad)
- **Tablet**: 768px-1024px
- **Desktop**: 1024px+

### Optimizaciones Móviles

- Formularios táctiles optimizados
- Botones de acción rápida
- Navegación simplificada
- Carga lazy de imágenes
- Offline basic support

## 🔧 Configuración Avanzada

### Variables de Entorno

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos  
MONGODB_URI=mongodb://localhost:27017/leads

# Autenticación
JWT_SECRET=clave_secreta_muy_larga_y_segura

# Subida de archivos
MAX_FILE_SIZE=10485760  # 10MB en bytes

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# CORS (producción)
CORS_ORIGIN=https://tu-dominio.com
```

### Seguridad

- ✅ **Helmet.js** para headers de seguridad
- ✅ **Rate limiting** para prevenir ataques
- ✅ **Validación de entrada** con sanitización
- ✅ **Contraseñas hasheadas** con bcrypt
- ✅ **JWT tokens** con expiración
- ✅ **CORS** configurado
- ✅ **Validación de archivos** CSV/Excel únicamente

### Performance

- ✅ **Paginación** en todas las listas
- ✅ **Índices MongoDB** optimizados
- ✅ **Compresión gzip** automática
- ✅ **Cache de queries** frecuentes
- ✅ **Bundle optimization** para frontend

## 📈 Métricas y Monitoreo

### Dashboard Admin

- Total de leads por estado
- Conversión por vendedor
- Tiempo promedio de respuesta
- Pipeline de ventas
- Leads sin asignar
- Performance ranking

### Métricas de Vendedor

- Leads asignados vs contactados
- Tasa de conversión individual
- Próximas acciones programadas
- Historial de actividad

## 🚀 Deploy en Producción

### Preparación

1. **Configurar variables de entorno** de producción
2. **Configurar MongoDB Atlas** o instancia dedicada
3. **Generar JWT_SECRET** seguro
4. **Configurar CORS** para dominio específico

### Docker (Opcional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 (Recomendado)

```bash
npm install -g pm2
pm2 start server/app.js --name "crm-leads"
pm2 startup
pm2 save
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando se implementen)
npm test

# Verificar health check
curl http://localhost:3000/api/health

# Verificar conexión MongoDB
npm run seed
```

## 🐛 Troubleshooting

### Problemas Comunes

**MongoDB no conecta:**
```bash
# Verificar que MongoDB esté corriendo
sudo systemctl status mongod

# Verificar URI en .env
echo $MONGODB_URI
```

**Error 401 Unauthorized:**
- Verificar que el token JWT no haya expirado
- Comprobar headers de Authorization
- Revisar JWT_SECRET en .env

**Importación CSV falla:**
- Verificar formato del archivo
- Comprobar límite de tamaño (10MB)
- Revisar logs de servidor

**Performance lenta:**
- Verificar índices de MongoDB
- Revisar tamaño de queries
- Activar paginación

## 📞 Soporte

Para soporte técnico:

1. Revisar logs: `npm run dev` (modo verbose)
2. Verificar health: `GET /api/health`
3. Consultar documentación API
4. Revisar troubleshooting section

---

**Versión:** 1.0.0  
**Autor:** Tu Nombre  
**Licencia:** ISC