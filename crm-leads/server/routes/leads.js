const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const User = require('../models/User');
const { auth, adminAuth, sellerAuth } = require('../middleware/auth');
const { validateLead, validateLeadStatus, sanitizeTextInput } = require('../middleware/validation');

// @route   GET /api/leads
// @desc    Get all leads (with filters)
// @access  Private
router.get('/', auth, sellerAuth, async (req, res) => {
  try {
    const { 
      status, 
      assignedTo, 
      type, 
      page = 1, 
      limit = 1000,
      search
    } = req.query;

    // Construir filtros
    let filter = {};
    
    // Si es vendedor, solo ver sus leads
    if (req.sellerFilter) {
      filter = { ...filter, ...req.sellerFilter };
    }
    
    if (status && status !== 'all') {
      if (status === 'contacted') {
        filter.status = { $ne: 'uncontacted' };
      } else {
        filter.status = status;
      }
    }
    if (type && type !== 'all') filter.type = type;
    if (assignedTo) {
      if (assignedTo === 'null') {
        filter.assignedTo = null;
      } else if (assignedTo === 'not-null') {
        filter.assignedTo = { $ne: null };
      } else {
        filter.assignedTo = assignedTo;
      }
    }
    
    // Búsqueda por texto
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Paginación
    const skip = (page - 1) * limit;
    const totalLeads = await Lead.countDocuments(filter);
    
    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        leads,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(totalLeads / limit),
          total: totalLeads,
          hasNext: skip + leads.length < totalLeads,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/leads/provinces-with-unassigned
// @desc    Get provinces that have unassigned leads
// @access  Private/Admin
router.get('/provinces-with-unassigned', auth, adminAuth, async (req, res) => {
  try {
    const provinces = await Lead.aggregate([
      // Match only unassigned leads
      { $match: { assignedTo: null } },
      // Group by province and count
      { 
        $group: { 
          _id: '$province', 
          count: { $sum: 1 } 
        } 
      },
      // Filter out null/undefined provinces
      { $match: { _id: { $ne: null } } },
      // Sort by count descending
      { $sort: { count: -1 } },
      // Format output
      { 
        $project: { 
          _id: 0, 
          name: '$_id', 
          count: 1 
        } 
      }
    ]);
    
    res.json({
      success: true,
      data: { provinces }
    });
    
  } catch (error) {
    console.error('Get provinces error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting provinces'
    });
  }
});

// @route   GET /api/leads/stats
// @desc    Get lead statistics
// @access  Private/Admin
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    // Basic stats
    const [totalLeads, unassignedLeads, assignedLeads, uncontactedLeads, wonLeads, contactedLeads] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ assignedTo: null }),
      Lead.countDocuments({ assignedTo: { $ne: null } }),
      Lead.countDocuments({ status: 'uncontacted' }),
      Lead.countDocuments({ status: 'won' }),
      Lead.countDocuments({ status: { $ne: 'uncontacted' } })
    ]);
    
    // Distribution by seller (detailed breakdown)
    const distributionStats = await Lead.aggregate([
      {
        $match: { assignedTo: { $ne: null } }
      },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          uncontacted: { $sum: { $cond: [{ $eq: ['$status', 'uncontacted'] }, 1, 0] } },
          contacted: { $sum: { $cond: [{ $ne: ['$status', 'uncontacted'] }, 1, 0] } },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'seller'
        }
      },
      {
        $unwind: '$seller'
      },
      {
        $project: {
          sellerId: '$_id',
          sellerName: '$seller.name',
          totalAssigned: 1,
          uncontacted: 1,
          contacted: 1,
          won: 1
        }
      },
      {
        $sort: { totalAssigned: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalLeads,
        assigned: assignedLeads,
        unassigned: unassignedLeads,
        uncontacted: uncontactedLeads,
        won: wonLeads,
        contacted: contactedLeads,
        distribution: distributionStats
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting statistics'
    });
  }
});

// @route   GET /api/leads/:id
// @desc    Get single lead
// @access  Private
router.get('/:id', auth, sellerAuth, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    
    // Si es vendedor, solo ver sus leads
    if (req.sellerFilter) {
      filter = { ...filter, ...req.sellerFilter };
    }

    const lead = await Lead.findOne(filter)
      .populate('assignedTo', 'name username')
      .populate('statusHistory.changedBy', 'name');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: { lead }
    });

  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/leads
// @desc    Create new lead
// @access  Private/Admin
router.post('/', auth, adminAuth, validateLead, sanitizeTextInput, async (req, res) => {
  try {
    const leadData = req.body;
    
    // Verificar duplicados
    const existingLead = await Lead.findOne({
      $or: [
        { phone: leadData.phone, name: leadData.name },
        { website: leadData.website }
      ]
    });

    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: 'Lead with this phone/name or website already exists'
      });
    }

    const lead = new Lead(leadData);
    await lead.save();

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: { lead }
    });

  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private
router.put('/:id', auth, sellerAuth, validateLead, sanitizeTextInput, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    
    // Si es vendedor, solo actualizar sus leads
    if (req.sellerFilter) {
      filter = { ...filter, ...req.sellerFilter };
    }

    const lead = await Lead.findOne(filter);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied'
      });
    }

    // Actualizar campos
    Object.assign(lead, req.body);
    lead.updatedAt = new Date();
    
    await lead.save();

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: { lead }
    });

  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/leads/:id/status
// @desc    Update lead status (optimized for mobile)
// @access  Private
router.put('/:id/status', auth, sellerAuth, validateLeadStatus, sanitizeTextInput, async (req, res) => {
  try {
    const { status, notes, nextAction } = req.body;
    
    let filter = { _id: req.params.id };
    
    // Si es vendedor, solo actualizar sus leads
    if (req.sellerFilter) {
      filter = { ...filter, ...req.sellerFilter };
    }

    const lead = await Lead.findOne(filter);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied'
      });
    }

    // Agregar al historial si el status cambió
    if (lead.status !== status) {
      lead.addStatusChange(status, req.user._id, notes);
    }

    // Actualizar campos
    lead.status = status;
    if (notes) lead.notes = notes;
    if (nextAction) lead.nextAction = new Date(nextAction);
    lead.lastContact = new Date();
    
    await lead.save();

    // Actualizar estadísticas del vendedor
    if (status === 'contacted') {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalContacted: 1 }
      });
    }

    res.json({
      success: true,
      message: 'Lead status updated successfully',
      data: { lead }
    });

  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/leads/assign
// @desc    Assign leads to sellers
// @access  Private/Admin
router.post('/assign', auth, adminAuth, async (req, res) => {
  try {
    const { leadIds, sellerId, assignmentType } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lead IDs array is required'
      });
    }

    // Verificar que el vendedor existe
    if (sellerId) {
      const seller = await User.findById(sellerId);
      if (!seller || seller.role !== 'seller') {
        return res.status(400).json({
          success: false,
          message: 'Invalid seller ID'
        });
      }
    }

    // Actualizar leads
    const updateData = {
      assignedTo: sellerId || null,
      assignedAt: sellerId ? new Date() : null
    };

    const result = await Lead.updateMany(
      { _id: { $in: leadIds } },
      updateData
    );

    // Actualizar estadísticas del vendedor
    if (sellerId) {
      await User.findByIdAndUpdate(sellerId, {
        $inc: { totalLeads: result.modifiedCount }
      });
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} leads assigned successfully`,
      data: {
        assignedCount: result.modifiedCount,
        sellerId,
        assignmentType
      }
    });

  } catch (error) {
    console.error('Assign leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/leads/:id/assign
// @desc    Assign single lead to seller
// @access  Private/Admin
router.put('/:id/assign', auth, adminAuth, async (req, res) => {
  try {
    const { sellerId } = req.body;
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Verify seller exists if provided
    if (sellerId) {
      const seller = await User.findById(sellerId);
      if (!seller || seller.role !== 'seller') {
        return res.status(400).json({
          success: false,
          message: 'Invalid seller ID'
        });
      }
    }

    // Update lead assignment
    lead.assignedTo = sellerId || null;
    lead.assignedAt = sellerId ? new Date() : null;
    await lead.save();

    // Update seller stats if assigned
    if (sellerId) {
      await User.findByIdAndUpdate(sellerId, {
        $inc: { totalLeads: 1 }
      });
    }

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      data: { lead }
    });

  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/leads/:id
// @desc    Delete lead
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update a lead
// @access  Private/Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove empty strings and prepare update object
    const cleanData = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== null && updateData[key] !== undefined && updateData[key] !== '') {
        cleanData[key] = updateData[key];
      }
    });
    
    const lead = await Lead.findByIdAndUpdate(
      id,
      { ...cleanData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name username');
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    res.json({
      success: true,
      data: { lead },
      message: 'Lead updated successfully'
    });
    
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating lead'
    });
  }
});

// @route   GET /api/leads/:id
// @desc    Get single lead
// @access  Private/Admin
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await Lead.findById(id).populate('assignedTo', 'name username');
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    res.json({
      success: true,
      data: { lead }
    });
    
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting lead'
    });
  }
});

// @route   POST /api/leads/bulk-assign
// @desc    Bulk assign leads to users
// @access  Private/Admin
router.post('/bulk-assign', auth, adminAuth, async (req, res) => {
  try {
    const { strategy, quantity, criteria, userId, userIds } = req.body;
    
    console.log('🔍 Bulk assignment request received:');
    console.log('- Strategy:', strategy);
    console.log('- Quantity:', quantity);
    console.log('- UserId (legacy):', userId);
    console.log('- UserIds (array):', userIds);
    console.log('- Criteria:', criteria);
    
    if (!strategy || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Strategy and quantity are required'
      });
    }
    
    // Build filter for leads to assign
    let filter = { assignedTo: null }; // Only unassigned leads
    
    if (criteria.status) filter.status = criteria.status;
    if (criteria.province) filter.province = criteria.province;
    
    let assignedCount = 0;
    
    // Determine which users to work with
    let targetUsers = [];
    
    if (userIds && userIds.length > 0) {
      // Use specified users
      console.log('📋 Looking for users with IDs:', userIds);
      targetUsers = await User.find({ _id: { $in: userIds }, role: 'seller', isActive: true });
      console.log('✅ Found', targetUsers.length, 'matching users');
    } else if (userId) {
      // Legacy support for single user
      console.log('📋 Looking for single user with ID:', userId);
      const user = await User.findById(userId);
      if (user && user.role === 'seller' && user.isActive) {
        targetUsers = [user];
        console.log('✅ Found single user:', user.name);
      }
    } else if (strategy === 'equitativo' || strategy === 'regional') {
      // Use all active sellers if no specific users selected
      console.log('📋 Looking for all active sellers (no specific users selected)');
      targetUsers = await User.find({ role: 'seller', isActive: true });
      console.log('✅ Found', targetUsers.length, 'active sellers');
    }
    
    console.log('👥 Target users found:', targetUsers.map(u => ({ id: u._id.toString(), name: u.name })));
    
    if (targetUsers.length === 0) {
      console.log('❌ No valid users found for assignment');
      return res.status(400).json({
        success: false,
        message: 'No valid users found for assignment'
      });
    }
    
    if (strategy === 'equitativo') {
      // Equitable distribution among selected users
      const leadsToAssign = await Lead.find(filter).limit(quantity);
      
      for (let i = 0; i < leadsToAssign.length; i++) {
        const lead = leadsToAssign[i];
        const seller = targetUsers[i % targetUsers.length]; // Round-robin distribution
        
        lead.assignedTo = seller._id;
        lead.assignedAt = new Date();
        await lead.save();
        assignedCount++;
        
        // Update seller stats
        await User.findByIdAndUpdate(seller._id, {
          $inc: { totalLeads: 1 }
        });
      }
      
    } else if (strategy === 'regional') {
      // Regional distribution - assign to sellers from the same province, limited to selected users
      const leadsToAssign = await Lead.find(filter).limit(quantity);
      
      for (const lead of leadsToAssign) {
        // Find sellers with matching province from selected users
        let matchingSellers = targetUsers.filter(seller => 
          seller.province === lead.province
        );
        
        if (matchingSellers.length === 0) {
          // Fallback to any selected user if no regional match
          matchingSellers = targetUsers;
        }
        
        if (matchingSellers.length > 0) {
          const randomSeller = matchingSellers[Math.floor(Math.random() * matchingSellers.length)];
          lead.assignedTo = randomSeller._id;
          lead.assignedAt = new Date();
          await lead.save();
          assignedCount++;
          
          // Update seller stats
          await User.findByIdAndUpdate(randomSeller._id, {
            $inc: { totalLeads: 1 }
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: { assignedCount },
      message: `${assignedCount} leads assigned successfully`
    });
    
  } catch (error) {
    console.error('Bulk assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk assignment'
    });
  }
});

module.exports = router;