const mongoose = require('mongoose');

const importHistorySchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  // Estadísticas del procesamiento
  stats: {
    totalRows: {
      type: Number,
      default: 0
    },
    validRows: {
      type: Number,
      default: 0
    },
    duplicatesRemoved: {
      type: Number,
      default: 0
    },
    invalidRemoved: {
      type: Number,
      default: 0
    },
    leadsCreated: {
      type: Number,
      default: 0
    }
  },
  
  // Mapeo de columnas usado
  columnMapping: {
    type: Object,
    default: {}
  },
  
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  
  errorMessage: {
    type: String
  },
  
  // Logs de procesamiento
  processingLogs: [{
    level: {
      type: String,
      enum: ['info', 'warning', 'error']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Índice para consultas por usuario y fecha
importHistorySchema.index({ uploadedBy: 1, uploadedAt: -1 });

// Método para agregar log
importHistorySchema.methods.addLog = function(level, message) {
  this.processingLogs.push({
    level,
    message,
    timestamp: new Date()
  });
};

module.exports = mongoose.model('ImportHistory', importHistorySchema);