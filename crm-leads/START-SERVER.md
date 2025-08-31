# 🚀 Guía para Iniciar el Servidor CRM

## ✅ Dependencias Resueltas

Las dependencias faltantes han sido corregidas:
- `cookie-parser` ✅ Instalado
- `express-validator` ✅ Instalado

## 🔧 Iniciar Servidor

### Opción 1: Puerto por Defecto (3000)
```bash
# Si el puerto 3000 está libre
npm run dev
```

### Opción 2: Puerto Alternativo
```bash
# Windows
set PORT=3001 && npm run dev

# Linux/Mac
PORT=3001 npm run dev
```

### Opción 3: Terminar Proceso Existente en Puerto 3000

**Windows:**
```bash
# Encontrar proceso
netstat -ano | findstr :3000

# Terminar proceso (reemplazar <PID> con el número encontrado)
taskkill /PID <PID> /F

# Luego iniciar servidor
npm run dev
```

**Linux/Mac:**
```bash
# Terminar proceso automáticamente
lsof -ti:3000 | xargs kill -9

# Luego iniciar servidor
npm run dev
```

## 🎯 Verificar que Funciona

1. **Servidor iniciado exitosamente** verás:
   ```
   ✅ MongoDB Connected
   🚀 Server running on port 3000
   📱 Frontend: http://localhost:3000
   🔗 API: http://localhost:3000/api
   ```

2. **Abrir navegador en:**
   - Frontend: `http://localhost:3000`
   - Health Check: `http://localhost:3000/api/health`

3. **Credenciales de prueba:**
   - Admin: `admin` / `admin123`
   - Vendedor: `vendedor1` / `vendedor123`

## 🐛 Solución de Problemas Comunes

### Error: Puerto ocupado
- Usar puerto alternativo: `set PORT=3001 && npm run dev`
- Terminar proceso existente (ver comandos arriba)

### Error: MongoDB no conecta
- Verificar MongoDB está corriendo: `net start MongoDB`
- Verificar URI en `.env`: `MONGODB_URI=mongodb://localhost:27017/leads`

### Error: Dependencias faltantes  
- Ejecutar: `npm install`
- Verificar: `node test-server.js`

## 🎉 Sistema Listo

Una vez iniciado correctamente, el sistema CRM estará completamente funcional con todas las características implementadas.