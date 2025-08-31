# CRM Leads Médicos/Estéticos - Referencia Completa

## 🎯 Visión del Proyecto
**Sistema CRM para gestionar leads fríos de clínicas y centros estéticos con 14 vendedores remotos**

- **Base de datos**: MongoDB (`mongodb://localhost:27017/leads`)
- **Roles**: Administrador y Vendedor
- **Objetivo**: Escalable, móvil-first, simple de usar

---

## 🚀 MVP - Versión 1.0 (Implementación Inicial)

### Funcionalidades Básicas
```yaml
✅ Autenticación simple (admin/vendedor)
✅ Gestión básica de leads
✅ Importación CSV manual
✅ Asignación simple de leads
✅ Seguimiento de estados básicos
✅ Interface responsive
```

### Stack Tecnológico MVP
```javascript
Backend:
  - Node.js + Express
  - MongoDB + Mongoose
  - JWT para autenticación
  - Multer para archivos CSV

Frontend:
  - HTML + CSS + JavaScript vanilla
  - Bootstrap 5 (responsive)
  - Formularios simples y funcionales

Estructura de archivos:
├── server/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, validation
│   └── app.js           # Express server
├── public/
│   ├── css/
│   ├── js/
│   └── index.html       # Single page app
└── uploads/             # CSV files
```

---

## 📊 Esquemas de Base de Datos

### 1. Colección Users
```javascript
{
  _id: ObjectId,
  username: String,      // unique
  email: String,         // unique
  password: String,      // bcrypt hashed
  role: String,          // "admin" | "seller"
  name: String,
  isActive: Boolean,
  createdAt: Date,
  
  // Stats básicas para MVP
  totalLeads: Number,    // leads asignados
  totalContacted: Number // leads contactados
}
```

### 2. Colección Leads
```javascript
{
  _id: ObjectId,
  name: String,          // nombre establecimiento
  contact: String,       // persona contacto
  phone: String,         // teléfono (requerido)
  address: String,
  website: String,       // sitio web (requerido)
  type: String,          // "clinica" | "estetica"
  rating: Number,        // valoración Google
  
  // Estado y asignación
  status: String,        // "uncontacted" | "contacted" | "interested" | "meeting" | "won" | "lost"
  assignedTo: ObjectId,  // ref: Users (null = sin asignar)
  assignedAt: Date,
  
  // Seguimiento
  notes: String,         // notas del vendedor
  lastContact: Date,
  nextAction: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Colección ImportHistory (Futuro)
```javascript
{
  _id: ObjectId,
  filename: String,
  uploadedBy: ObjectId,  // ref: Users
  uploadedAt: Date,
  totalRows: Number,
  validRows: Number,
  status: String         // "completed" | "failed"
}
```

---

## 🖥️ Interface de Usuario - MVP

### Panel Administrador
```html
<!-- Dashboard Admin -->
📊 Estadísticas generales
├── Total leads: 1,247
├── Sin asignar: 156  
├── En proceso: 234
└── Cerrados: 89

📋 Gestión de Leads
├── Importar CSV → formulario simple
├── Lista de leads → tabla básica
├── Asignar leads → dropdown vendedor
└── Ver estadísticas → gráficos básicos

👥 Gestión Vendedores  
├── Lista vendedores → tabla
├── Crear vendedor → formulario
└── Ver performance → tabla stats
```

### Panel Vendedor
```html
<!-- Dashboard Vendedor -->
📱 Mis Leads (Mobile-First)
├── Lead #1: Clínica Sonrisa
│   ├── 📞 011-1234-5678
│   ├── 🏥 Clínica Dental
│   ├── ⭐ 4.5/5
│   └── [Contactar] [Actualizar]
│
├── Lead #2: Centro Estético Bella
│   └── Estado: Interesado ✅
│
└── [+ Actualizar Lead]

📝 Formulario Actualización (Simple)
├── Estado: [Dropdown]
├── Notas: [Textarea]
├── Próxima acción: [Date]
└── [Guardar]
```

---

## 🔧 API Endpoints - MVP

### Autenticación
```javascript
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Leads
```javascript
GET    /api/leads              // Lista leads (con filtros)
GET    /api/leads/:id          // Lead específico
PUT    /api/leads/:id          // Actualizar lead
DELETE /api/leads/:id          // Eliminar lead (admin only)
POST   /api/leads/import       // Importar CSV
POST   /api/leads/assign       // Asignar leads
```

### Usuarios
```javascript
GET    /api/users              // Lista vendedores (admin only)
POST   /api/users              // Crear vendedor (admin only)
PUT    /api/users/:id          // Actualizar vendedor
GET    /api/users/stats        // Estadísticas vendedor
```

---

## 📱 Diseño Mobile-First

### Formularios Optimizados
```css
/* Mobile-first CSS */
.lead-card {
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-contact, .btn-update {
  flex: 1;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

/* Responsive breakpoints */
@media (min-width: 768px) {
  .lead-grid { 
    display: grid; 
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}
```

### Estados de Lead - Colores
```css
.status-uncontacted { border-left: 4px solid #dc3545; } /* Rojo */
.status-contacted   { border-left: 4px solid #ffc107; } /* Amarillo */
.status-interested  { border-left: 4px solid #17a2b8; } /* Azul */
.status-meeting     { border-left: 4px solid #6f42c1; } /* Púrpura */
.status-won         { border-left: 4px solid #28a745; } /* Verde */
.status-lost        { border-left: 4px solid #6c757d; } /* Gris */
```

---

## 🚀 Plan de Escalamiento

### Fase 1: MVP (Semanas 1-2)
```yaml
Objetivo: Sistema funcional básico
Componentes:
  ✅ Autenticación JWT
  ✅ CRUD leads básico
  ✅ Importación CSV simple
  ✅ Interface responsive
  ✅ Asignación manual

Criterio de Éxito:
  - 1 admin puede importar leads
  - 14 vendedores pueden actualizar sus leads
  - Interface funciona en móvil
```

### Fase 2: Mejoras (Semanas 3-4)
```yaml
Objetivo: Optimización y reportes
Componentes:
  🔄 Validación de datos avanzada
  🔄 Dashboard con gráficos
  🔄 Asignación automática
  🔄 Exportación de reportes
  🔄 Notificaciones básicas

Criterio de Éxito:
  - 0% leads duplicados
  - Reportes de conversión
  - Alertas de seguimiento
```

### Fase 3: Avanzado (Semanas 5-6)
```yaml
Objetivo: Funcionalidades avanzadas
Componentes:
  🎯 PWA (Progressive Web App)
  🎯 Sincronización offline
  🎯 Analytics avanzados
  🎯 Integraciones (WhatsApp, Email)
  🎯 Backup automático

Criterio de Éxito:
  - App instalable en móvil
  - Trabajo offline
  - Métricas de performance
```

---

## 💡 Casos de Uso Principales

### Admin - Flujo Diario
1. **Importar leads nuevos**
   ```
   Subir CSV → Verificar datos → Confirmar importación
   ```

2. **Distribuir leads**
   ```
   Seleccionar leads sin asignar → Elegir vendedor → Asignar
   ```

3. **Monitorear performance**
   ```
   Ver dashboard → Revisar conversiones → Reasignar si necesario
   ```

### Vendedor - Flujo Diario
1. **Ver leads asignados**
   ```
   Login → Dashboard → Lista de leads pendientes
   ```

2. **Contactar lead**
   ```
   Seleccionar lead → Llamar/visitar → Actualizar estado y notas
   ```

3. **Programar seguimiento**
   ```
   Agendar próxima acción → Guardar → Continuar con siguiente
   ```

---

## 🔧 Código de Ejemplo - Estructura Base

### Modelo Lead (Mongoose)
```javascript
const leadSchema = new Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  phone: { type: String, required: true },
  website: { type: String, required: true },
  address: String,
  type: { 
    type: String, 
    enum: ['clinica', 'estetica'],
    default: 'clinica'
  },
  status: {
    type: String,
    enum: ['uncontacted', 'contacted', 'interested', 'meeting', 'won', 'lost'],
    default: 'uncontacted'
  },
  assignedTo: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  assignedAt: Date,
  notes: String,
  lastContact: Date,
  nextAction: Date
}, { 
  timestamps: true 
});
```

### API Route Ejemplo
```javascript
// GET /api/leads - Lista leads con filtros
router.get('/leads', auth, async (req, res) => {
  try {
    const { status, assigned } = req.query;
    const filter = {};
    
    // Filtros
    if (status) filter.status = status;
    if (assigned === 'me' && req.user.role === 'seller') {
      filter.assignedTo = req.user._id;
    }
    
    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
      
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📝 Notas de Implementación

### Prioridades MVP
1. **Simplicidad**: Interfaces mínimas pero funcionales
2. **Responsive**: Mobile-first design
3. **Datos limpios**: Validación básica pero efectiva
4. **Performance**: Consultas optimizadas desde el inicio

### Decisiones Técnicas
- **MongoDB**: Flexible para evolución del schema
- **JWT**: Autenticación stateless y simple
- **Bootstrap**: Componentes rápidos y probados
- **Vanilla JS**: Evita complejidad innecesaria en MVP

### Métricas de Éxito
- **Adopción**: 14 vendedores activos en 1 semana
- **Performance**: < 2 segundos carga en móvil
- **Calidad datos**: < 5% leads duplicados
- **Usabilidad**: < 10 minutos para actualizar lead

---

**🎯 Próximo paso**: Implementar MVP con las funcionalidades básicas y luego escalar según necesidades reales del equipo.