const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Datos del establecimiento - Solo name es obligatorio
  name: {
    type: String,
    required: [true, 'Establishment name is required'],
    trim: true
  },
  contact: {
    type: String,
    trim: true  // Ya no obligatorio
  },
  phone: {
    type: String,
    trim: true  // Ya no obligatorio
  },
  email: {
    type: String,
    trim: true  // Nuevo campo opcional
  },
  address: {
    type: String,
    trim: true
  },
  province: {
    type: String,
    trim: true,
    default: 'Buenos Aires'
  },
  city: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true  // Ya no obligatorio
  },
  type: {
    type: String,
    trim: true,  // Texto libre en lugar de enum
    default: 'clinica'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,  // Nuevo: cantidad de reseñas
    min: 0
  },
  schedule: {
    type: String,  // Nuevo: horarios de atención
    trim: true
  },
  googleUrl: {
    type: String,
    trim: true
  },
  
  // Estado y asignación
  status: {
    type: String,
    enum: ['uncontacted', 'contacted', 'interested', 'meeting', 'won', 'lost'],
    default: 'uncontacted'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date
  },
  
  // Seguimiento
  notes: {
    type: String,
    trim: true
  },
  lastContact: {
    type: Date
  },
  nextAction: {
    type: Date
  },
  
  // Historial de cambios básico
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    note: String
  }]
}, {
  timestamps: true
});

// Índices para optimizar consultas
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });

// Índices únicos para prevenir duplicados
// Único por teléfono (si existe)
leadSchema.index({ phone: 1 }, { 
  unique: true, 
  sparse: true, // Solo aplica si el campo existe
  partialFilterExpression: { phone: { $type: "string", $ne: "" } }
});

// Único por URL de Google (si existe)
leadSchema.index({ googleUrl: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { googleUrl: { $type: "string", $ne: "" } }
});

// Índice compuesto para detectar duplicados por nombre y provincia
leadSchema.index({ name: 1, province: 1, city: 1 }, { 
  unique: true,
  partialFilterExpression: { 
    name: { $type: "string", $ne: "" },
    province: { $type: "string", $ne: "" }
  }
});

// Pre-save hook para validaciones adicionales de duplicados
leadSchema.pre('save', async function(next) {
  // Solo validar si es un documento nuevo o si se han cambiado campos críticos
  if (this.isNew || this.isModified('phone') || this.isModified('name') || this.isModified('googleUrl')) {
    try {
      const duplicateQuery = { _id: { $ne: this._id } };
      const orConditions = [];

      // Verificar duplicado por teléfono (si existe)
      if (this.phone && this.phone.trim()) {
        orConditions.push({ phone: this.phone });
      }

      // Verificar duplicado por nombre exacto en la misma provincia/ciudad
      if (this.name && this.province) {
        const nameCondition = { 
          name: this.name, 
          province: this.province 
        };
        if (this.city) {
          nameCondition.city = this.city;
        }
        orConditions.push(nameCondition);
      }

      // Verificar duplicado por Google URL (si existe)
      if (this.googleUrl && this.googleUrl.trim()) {
        orConditions.push({ googleUrl: this.googleUrl });
      }

      if (orConditions.length > 0) {
        duplicateQuery.$or = orConditions;
        const existingLead = await this.constructor.findOne(duplicateQuery);
        
        if (existingLead) {
          const error = new Error('Duplicate lead detected');
          error.name = 'ValidationError';
          error.code = 11000; // MongoDB duplicate key error code
          error.duplicateField = this.phone ? 'phone' : this.googleUrl ? 'googleUrl' : 'name';
          error.duplicateValue = this.phone || this.googleUrl || this.name;
          return next(error);
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Método para agregar cambio de status al historial
leadSchema.methods.addStatusChange = function(newStatus, changedBy, note) {
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    note
  });
  this.status = newStatus;
};

// Virtual para obtener el nombre del vendedor asignado
leadSchema.virtual('assignedSellerName').get(function() {
  return this.assignedTo ? this.assignedTo.name : 'Sin asignar';
});

// Asegurar que los virtuals se incluyan en JSON
leadSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Lead', leadSchema);