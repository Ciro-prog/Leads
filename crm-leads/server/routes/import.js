const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const Lead = require('../models/Lead');
const ImportHistory = require('../models/ImportHistory');
const { auth, adminAuth } = require('../middleware/auth');

// Configurar multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `import-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/import/upload
// @desc    Upload and preview CSV file (optimized for large files)
// @access  Private/Admin
router.post('/upload', auth, adminAuth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { page = 1, limit = 5 } = req.query;
    const pageNum = parseInt(page);
    const pageLimit = parseInt(limit);
    const skipRows = (pageNum - 1) * pageLimit;

    const filePath = req.file.path;
    const results = [];
    let headers = [];
    let rowCount = 0;
    let dataRowCount = 0;
    let previewStarted = false;

    // Leer y parsear CSV de manera eficiente
    const stream = fs.createReadStream(filePath)
      .pipe(csv({ headers: false }))
      .on('data', (data) => {
        rowCount++;
        
        if (rowCount === 1) {
          // Primera fila = headers
          headers = Object.values(data);
        } else {
          dataRowCount++;
          
          // Solo procesar las filas necesarias para esta página
          if (dataRowCount > skipRows && results.length < pageLimit) {
            results.push(Object.values(data));
            previewStarted = true;
          }
          
          // Si ya tenemos suficientes filas para esta página, podemos parar
          if (results.length >= pageLimit && pageNum === 1) {
            // Para la primera página, seguir contando para obtener el total
            // pero no almacenar más datos
          }
        }
      })
      .on('end', () => {
        const totalDataRows = rowCount - 1; // Excluir header
        const totalPages = Math.ceil(totalDataRows / pageLimit);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.json({
          success: true,
          message: 'File uploaded and preview generated',
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            headers,
            rows: results,
            pagination: {
              currentPage: pageNum,
              totalPages,
              totalRows: totalDataRows,
              pageSize: pageLimit,
              hasNextPage,
              hasPrevPage
            },
            stats: {
              totalRows: totalDataRows,
              previewRows: results.length,
              errors: []
            },
            fileSize: req.file.size
          }
        });
      })
      .on('error', (error) => {
        console.error('CSV processing error:', error);
        res.status(500).json({
          success: false,
          message: 'Error processing CSV: ' + error.message
        });
      });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file: ' + error.message
    });
  }
});

// @route   POST /api/import/process
// @desc    Process uploaded CSV with column mapping
// @access  Private/Admin
router.post('/process', auth, adminAuth, async (req, res) => {
  try {
    const { filename, columnMapping, skipDuplicates = true } = req.body;

    if (!filename || !columnMapping) {
      return res.status(400).json({
        success: false,
        message: 'Filename and column mapping are required'
      });
    }

    // Crear registro de importación
    const importRecord = new ImportHistory({
      filename,
      originalName: req.body.originalName || filename,
      uploadedBy: req.user._id,
      columnMapping
    });
    await importRecord.save();

    const filePath = path.join('uploads', filename);
    const results = [];
    const errors = [];
    let processed = 0;
    let duplicates = 0;
    let invalid = 0;

    // Leer archivo CSV de manera secuencial para evitar race conditions
    const allRows = [];
    
    // Primero, leer todas las filas
    const readStream = fs.createReadStream(filePath)
      .pipe(csv({ headers: false }))
      .on('data', (row) => {
        allRows.push(row);
      })
      .on('end', async () => {
        try {
          console.log(`📊 Processing ${allRows.length} total rows (including header)`);
          
          // Procesar filas secuencialmente para evitar race conditions
          for (let i = 1; i < allRows.length; i++) { // Skip header row
            const row = allRows[i];
            processed++;

            try {
              // Mapear datos según configuración - Solo campos seleccionados
              const leadData = {};
              
              Object.keys(columnMapping).forEach(field => {
                const columnIndex = columnMapping[field];
                if (columnIndex !== null && columnIndex !== '' && row[columnIndex]) {
                  leadData[field] = String(row[columnIndex]).trim();
                }
              });
              
              // Solo incluir provincia por defecto si no fue mapeada
              if (!leadData.province && defaultProvince) {
                leadData.province = defaultProvince;
              }

              // Validaciones básicas - name y provincia obligatorios
              if (!leadData.name || !leadData.name.trim()) {
                invalid++;
                importRecord.addLog('warning', `Row ${i + 1}: Missing required field (name)`);
                continue;
              }
              
              if (!leadData.province || !leadData.province.trim()) {
                invalid++;
                importRecord.addLog('warning', `Row ${i + 1}: Missing required field (province)`);
                continue;
              }

              // Limpiar y formatear datos
              if (leadData.phone) {
                leadData.phone = cleanPhoneNumber(leadData.phone);
              }
              if (leadData.website) {
                leadData.website = cleanWebsite(leadData.website);
              }
              if (leadData.rating) {
                leadData.rating = parseFloat(leadData.rating) || 0;
              }
              if (leadData.reviewCount) {
                // Limpiar paréntesis: (18) -> 18
                const cleanCount = leadData.reviewCount.replace(/[()]/g, '');
                leadData.reviewCount = parseInt(cleanCount) || 0;
              }

              // Verificar duplicados por teléfono y nombre (como solicitó el usuario)
              if (skipDuplicates) {
                const duplicateQuery = {
                  $or: []
                };
                
                // Verificar por teléfono si existe
                if (leadData.phone) {
                  duplicateQuery.$or.push({ phone: leadData.phone });
                }
                
                // Verificar por nombre exacto
                duplicateQuery.$or.push({ name: leadData.name });
                
                // También verificar por Google URL si existe (único por establecimiento)
                if (leadData.googleUrl) {
                  duplicateQuery.$or.push({ googleUrl: leadData.googleUrl });
                }
                
                // CRÍTICO: Verificar también contra leads ya procesados en esta importación
                const duplicateInCurrentBatch = results.find(existingLead => {
                  if (leadData.phone && existingLead.phone === leadData.phone) return true;
                  if (existingLead.name === leadData.name) return true;
                  if (leadData.googleUrl && existingLead.googleUrl === leadData.googleUrl) return true;
                  return false;
                });

                if (duplicateInCurrentBatch) {
                  duplicates++;
                  importRecord.addLog('info', `Row ${i + 1}: Duplicate in current batch skipped (${leadData.name})`);
                  continue;
                }

                const existing = await Lead.findOne(duplicateQuery);

                if (existing) {
                  duplicates++;
                  importRecord.addLog('info', `Row ${i + 1}: Duplicate in database skipped (${leadData.name})`);
                  continue;
                }
              }

              // Crear lead
              const lead = new Lead(leadData);
              results.push(lead);

            } catch (error) {
              invalid++;
              errors.push(`Row ${i + 1}: ${error.message}`);
              importRecord.addLog('error', `Row ${i + 1}: ${error.message}`);
            }
          }

          // Insertar leads en lote
          let created = 0;
          if (results.length > 0) {
            console.log(`💾 Inserting ${results.length} leads into database...`);
            try {
              const insertResult = await Lead.insertMany(results, { ordered: false });
              created = insertResult.length;
              console.log(`✅ Successfully inserted ${created} leads`);
            } catch (insertError) {
              console.error('❌ Error during insertMany:', insertError);
              
              // If batch insert fails, try individual inserts to handle any remaining duplicates
              for (const lead of results) {
                try {
                  await lead.save();
                  created++;
                } catch (individualError) {
                  if (individualError.code === 11000) { // MongoDB duplicate key error
                    duplicates++;
                    importRecord.addLog('info', `Duplicate detected during save: ${lead.name}`);
                  } else {
                    invalid++;
                    errors.push(`Error saving lead ${lead.name}: ${individualError.message}`);
                    importRecord.addLog('error', `Error saving lead ${lead.name}: ${individualError.message}`);
                  }
                }
              }
              console.log(`✅ After individual saves: ${created} leads created`);
            }
          }

          // Actualizar estadísticas del import
          importRecord.stats = {
            totalRows: processed,
            validRows: results.length,
            duplicatesRemoved: duplicates,
            invalidRemoved: invalid,
            leadsCreated: created
          };
          importRecord.status = 'completed';
          await importRecord.save();

          // Limpiar archivo temporal
          try {
            await fsPromises.unlink(filePath);
          } catch (unlinkError) {
            console.error('Error deleting temp file:', unlinkError);
          }

          console.log(`📈 Import completed - Created: ${created}, Duplicates: ${duplicates}, Invalid: ${invalid}`);

          res.json({
            success: true,
            message: `Import completed successfully. ${created} leads created, ${duplicates} duplicates skipped.`,
            data: {
              importId: importRecord._id,
              stats: importRecord.stats,
              errors: errors.slice(0, 10) // Solo primeros 10 errores
            }
          });

        } catch (saveError) {
          console.error('Error during import process:', saveError);
          importRecord.status = 'failed';
          importRecord.errorMessage = saveError.message;
          await importRecord.save();

          res.status(500).json({
            success: false,
            message: 'Error saving leads to database',
            error: saveError.message
          });
        }
      });

  } catch (error) {
    console.error('Process import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing import: ' + error.message
    });
  }
});

// @route   GET /api/import/history
// @desc    Get import history
// @access  Private/Admin
router.get('/history', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    const total = await ImportHistory.countDocuments();

    const imports = await ImportHistory.find()
      .populate('uploadedBy', 'name username')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        imports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          hasNext: skip + imports.length < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get import history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/import/:id
// @desc    Get import details
// @access  Private/Admin
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const importRecord = await ImportHistory.findById(req.params.id)
      .populate('uploadedBy', 'name username');

    if (!importRecord) {
      return res.status(404).json({
        success: false,
        message: 'Import record not found'
      });
    }

    res.json({
      success: true,
      data: { import: importRecord }
    });

  } catch (error) {
    console.error('Get import details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Funciones auxiliares
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  // Remover caracteres especiales y espacios
  return phone.replace(/[^\d+]/g, '').trim();
}

function cleanWebsite(website) {
  if (!website) return '';
  
  // Si es URL de Google Ads, intentar extraer el dominio real
  if (website.includes('googleadservices.com')) {
    const urlParams = new URLSearchParams(website.split('?')[1]);
    const adurl = urlParams.get('adurl');
    if (adurl) {
      try {
        const decoded = decodeURIComponent(adurl);
        return decoded;
      } catch (e) {
        console.warn('Error decoding Google Ads URL:', e);
      }
    }
  }
  
  // Si es URL de Google Maps, mantenerla pero limpiarla
  if (website.includes('google.com/maps')) {
    return website; // Mantener URLs de Google Maps completas
  }
  
  // Para URLs normales, limpiar espacios
  return website.trim();
}

// @route   POST /api/import/leads
// @desc    Import leads from uploaded CSV (with batch processing)
// @access  Private/Admin
router.post('/leads', auth, adminAuth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { columnMapping, defaultProvince = 'Buenos Aires', batchSize = 100 } = req.body;
    const parsedColumnMapping = JSON.parse(columnMapping || '{}');
    
    if (!columnMapping || Object.keys(parsedColumnMapping).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Column mapping is required'
      });
    }

    // Create import record
    const importRecord = new ImportHistory({
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadedBy: req.user._id,
      columnMapping: parsedColumnMapping
    });
    await importRecord.save();

    const filePath = req.file.path;
    const results = [];
    const errors = [];
    let processed = 0;
    let imported = 0;
    let skipped = 0;
    let duplicates = 0;

    // Process CSV
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ headers: false }))
        .on('data', async (row) => {
          processed++;
          if (processed === 1) return; // Skip header row

          try {
            // Map data according to column mapping - Solo campos seleccionados
            const leadData = {};
            
            Object.keys(parsedColumnMapping).forEach(field => {
              const csvColumn = parsedColumnMapping[field];
              if (csvColumn !== null && csvColumn !== '' && row[csvColumn] !== undefined) {
                leadData[field] = String(row[csvColumn]).trim();
              }
            });

            // Set default province if not mapped
            if (!leadData.province && defaultProvince) {
              leadData.province = defaultProvince;
            }

            // Basic validations - name y provincia obligatorios
            if (!leadData.name || !leadData.name.trim()) {
              skipped++;
              errors.push(`Fila ${processed}: Falta campo requerido (nombre)`);
              return;
            }
            
            if (!leadData.province || !leadData.province.trim()) {
              skipped++;
              errors.push(`Fila ${processed}: Falta campo requerido (provincia)`);
              return;
            }

            // Clean and format data
            if (leadData.phone) {
              leadData.phone = cleanPhoneNumber(leadData.phone);
            }
            if (leadData.website) {
              leadData.website = cleanWebsite(leadData.website);
            }
            if (leadData.reviewCount) {
              const cleanCount = leadData.reviewCount.replace(/[()]/g, '');
              leadData.reviewCount = parseInt(cleanCount) || 0;
            }
            if (leadData.rating) {
              leadData.rating = parseFloat(leadData.rating) || 0;
            }
            
            // Check for duplicates por teléfono y nombre (como solicitó el usuario)
            const duplicateQuery = {
              $or: []
            };
            
            // Verificar por teléfono si existe
            if (leadData.phone) {
              duplicateQuery.$or.push({ phone: leadData.phone });
            }
            
            // Verificar por nombre exacto
            duplicateQuery.$or.push({ name: leadData.name });
            
            // También verificar por Google URL si existe (único por establecimiento)
            if (leadData.googleUrl) {
              duplicateQuery.$or.push({ googleUrl: leadData.googleUrl });
            }
            
            const existingLead = await Lead.findOne(duplicateQuery);

            if (existingLead) {
              duplicates++;
              return;
            }

            // Create new lead
            const newLead = new Lead(leadData);
            await newLead.save();
            imported++;

          } catch (error) {
            console.error('Error processing row:', error);
            skipped++;
            errors.push(`Fila ${processed}: Error procesando datos - ${error.message}`);
          }
        })
        .on('end', async () => {
          // Update import record
          importRecord.totalRows = processed - 1;
          importRecord.importedRows = imported;
          importRecord.skippedRows = skipped;
          importRecord.duplicateRows = duplicates;
          importRecord.errors = errors;
          importRecord.completedAt = new Date();
          await importRecord.save();

          // Clean up uploaded file
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Error deleting file:', err);
          }

          res.json({
            success: true,
            data: {
              imported,
              skipped,
              duplicates,
              errors: errors.length,
              errorDetails: errors.slice(0, 10), // Only first 10 errors
              totalProcessed: processed - 1
            }
          });
        })
        .on('error', (error) => {
          console.error('CSV processing error:', error);
          res.status(500).json({
            success: false,
            message: 'Error procesando archivo CSV: ' + error.message
          });
        });
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing leads: ' + error.message
    });
  }
});

// Error handler para multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: error.message || 'Upload error'
  });
});

module.exports = router;