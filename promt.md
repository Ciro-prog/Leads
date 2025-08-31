# Prompt para Desarrollar CRM de Leads Médicos/Estéticos

## Contexto del Proyecto
Necesito desarrollar un sistema CRM personalizado para gestionar leads fríos de clínicas y centros estéticos extraídos de Google Maps. El sistema debe manejar 14 vendedores remotos distribuidos en diferentes provincias.

## Requerimientos Funcionales

### 1. Gestión de Leads
- Importación masiva desde CSV/Excel con datos de Google Maps
- Campos específicos: nombre establecimiento, contacto, teléfono, dirección, valoración Google, página web, tipo (clínica/estética)
- Estados de lead: Sin Contactar → Contactado → Interesado → Reunión Programada → Cerrado (Ganado/Perdido)
- Sistema de notas y seguimiento por cada interacción

### 2. Gestión de Vendedores
- 14 vendedores remotos (no territoriales)
- Asignación manual y automática de leads
- Perfil de vendedor con estadísticas individuales
- Posibilidad de reasignar leads entre vendedores

### 3. Dashboard y Reportes
Crear reportes completos incluyendo:
- Conversión por vendedor (leads asignados vs cerrados)
- Tiempo promedio de respuesta por vendedor
- Pipeline actual por vendedor
- Ranking de performance
- Reportes por tipo de establecimiento
- Estado general del pipeline
- Leads sin contactar por tiempo (alertas)

### 4. Interface de Usuario
- Panel administrativo para gestión de leads y asignaciones
- Interface simple para vendedores (formulario de actualización)
- Diseño responsive para uso en móvil y desktop
- No requiere sincronización en tiempo real

## Especificaciones Técnicas Sugeridas

### Stack Tecnológico
- Frontend: React o HTML/CSS/JavaScript vanilla
- Backend: Node.js con Express/NestJS, Python (FastAPI/Django) o PHP
- **Base de datos: MongoDB con Mongoose (Node.js) o PyMongo (Python)**
- Autenticación: JWT con sistema de roles (admin/vendedor)
- File Upload: Multer (Node.js) o similar para manejo de CSV/Excel

### Arquitectura
- Separación clara entre panel administrativo y interface de vendedor
- API REST para operaciones CRUD
- **Sistema de roles y permisos** (Admin: CRUD completo, Vendedor: solo sus leads)
- **Esquemas MongoDB**:
  - Users (admin/vendedores con credenciales)
  - Leads (con referencia al vendedor asignado)
  - Import_History (historial de importaciones con stats)
- Validación de datos en backend con reglas de negocio
- Backup automático de MongoDB

### Funcionalidades Específicas a Implementar

#### Panel Administrativo:
1. **Importador de Leads Avanzado**
   - Carga masiva desde CSV/Excel con preview
   - **Editor de encabezados**: Permitir editar nombres de columnas antes de importar
   - **Validación y limpieza obligatoria**:
     - Detectar y eliminar duplicados automáticamente (por nombre + teléfono)
     - Eliminar registros sin teléfono, página web O contacto
     - Mostrar estadísticas de limpieza (registros eliminados/mantenidos)
   - **Mapeo inteligente de columnas** con sugerencias automáticas
   - **Preview de datos limpios** antes de confirmar importación

2. **Distribuidor de Leads Flexible**
   - **Asignación por cantidad**: Asignar X cantidad específica a cada vendedor
   - **Asignación masiva**: Asignar X cantidad a todos los vendedores simultáneamente
   - **Asignación manual**: Selección individual drag & drop
   - **Asignación automática**: Round-robin, por carga de trabajo, aleatoria
   - **Reasignación masiva**: Mover leads entre vendedores
   - **Pool de leads no asignados**: Banco común de leads disponibles

3. **Gestión de Usuarios Vendedores**
   - **Creación de usuarios vendedor** desde panel admin
   - **Gestión de credenciales**: Username, password, email
   - **Configuración de vendedor**: Nombre, zona preferida, límites de asignación
   - **Activar/desactivar vendedores** sin perder sus leads
   - **Estadísticas por vendedor**: Leads asignados, contactados, convertidos

3. **Monitor de Actividad**
   - Vista general del estado de todos los leads
   - Alertas por leads sin contactar en X días
   - Histórico de actividades por vendedor

#### Interface de Vendedor:
1. **Lista de Leads Asignados**
   - Vista filtrable por estado
   - Información completa del establecimiento
   - Botones de acción rápida

2. **Formulario de Seguimiento**
   - Actualización de estado del lead
   - Campo de notas de la llamada/visita
   - Programación de próxima acción
   - Upload de documentos/fotos si es necesario

#### Sistema de Reportes:
1. **Dashboard Principal**
   - KPIs generales en tiempo real
   - Gráficos de conversión
   - Distribución de leads por estado

2. **Reportes Detallados**
   - Exportación a Excel/PDF
   - Filtros por fecha, vendedor, estado
   - Comparativas entre vendedores

## Flujo de Trabajo Esperado

1. **Importación con Limpieza**:
   - Admin sube CSV/Excel con leads de Google Maps
   - Sistema muestra preview y permite editar encabezados
   - Validación automática: elimina duplicados y registros sin teléfono/web/contacto
   - Admin confirma importación después de ver estadísticas de limpieza

2. **Gestión de Usuarios**:
   - Admin crea cuentas de vendedores con credenciales
   - Configuración inicial de cada vendedor (nombre, preferencias)

3. **Distribución Flexible**:
   - Admin asigna leads por cantidad específica a vendedores individuales
   - O asignación masiva (ej: 50 leads a cada uno de los 14 vendedores)
   - Sistema mantiene pool de leads no asignados

4. **Trabajo de Campo**: 
   - Vendedores acceden solo a sus leads asignados
   - Actualizan estados y notas de seguimiento

5. **Monitoreo y Reportes**: 
   - Admin monitorea progreso general y por vendedor
   - Reasignación de leads según performance o disponibilidad

## Datos de Ejemplo
Los leads típicos incluyen:
- Nombre: "Clínica Dental Sonrisa"
- Contacto: "Dr. Juan Pérez"
- Teléfono: "+54 11 1234-5678"
- Dirección: "Av. Corrientes 1234, CABA"
- Valoración: "4.5 estrellas"
- Página Web: "clinicasonrisa.com.ar"
- Tipo: "Clínica Dental"

## Criterios de Éxito
- **Importación sin duplicados**: 0% de leads duplicados en la base
- **Datos limpios**: 100% de leads con teléfono, web y contacto válidos
- **Asignación flexible**: Poder asignar X cantidad específica por vendedor
- **Gestión de usuarios**: Admin puede crear/gestionar vendedores fácilmente
- Reducir tiempo de asignación de leads de manual a automático
- Visibilidad completa del pipeline de ventas por vendedor
- Trazabilidad de todas las interacciones
- Reportes actionables para mejorar performance
- Interface simple que no requiera capacitación extensa

## Pregunta Específica
¿Podrías ayudarme a desarrollar este CRM paso a paso, empezando por [especificar qué parte quieres desarrollar primero: estructura de base de datos, interface de importación, dashboard, etc.]?

---

*Personaliza este prompt según tus necesidades específicas y úsalo para solicitar el desarrollo de cada componente del CRM.*