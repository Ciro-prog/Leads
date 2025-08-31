const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lead = require('../models/Lead');
const { auth, adminAuth } = require('../middleware/auth');
const { validateUserRegistration, sanitizeTextInput } = require('../middleware/validation');

// @route   GET /api/users
// @desc    Get all users/sellers
// @access  Private/Admin
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { role, active, page = 1, limit = 50 } = req.query;
    
    let filter = {};
    if (role) filter.role = role;
    if (active !== undefined) filter.isActive = active === 'true';
    
    const skip = (page - 1) * limit;
    const totalUsers = await User.countDocuments(filter);
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: skip + users.length < totalUsers,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/sellers
// @desc    Get only sellers for dropdown/assignment
// @access  Private
router.get('/sellers', auth, async (req, res) => {
  try {
    const sellers = await User.find({ 
      role: 'seller', 
      isActive: true 
    })
    .select('_id name username totalLeads totalContacted')
    .sort({ name: 1 });

    res.json({
      success: true,
      data: { sellers }
    });

  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Obtener estadísticas adicionales del vendedor
    if (user.role === 'seller') {
      const stats = await Lead.aggregate([
        { $match: { assignedTo: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const statusCounts = {};
      stats.forEach(stat => {
        statusCounts[stat._id] = stat.count;
      });

      user._doc.leadsByStatus = statusCounts;
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private/Admin
router.post('/', auth, adminAuth, validateUserRegistration, sanitizeTextInput, async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Crear nuevo usuario
    const user = new User({
      username,
      email,
      password,
      name,
      role: role || 'seller'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: user.toJSON() }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', auth, adminAuth, sanitizeTextInput, async (req, res) => {
  try {
    const { name, email, username, role, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verificar duplicados de email/username
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Actualizar campos
    if (name) user.name = name;
    if (email) user.email = email;
    if (username) user.username = username;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: user.toJSON() }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private/Admin
router.put('/:id/toggle-status', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: user.toJSON() }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id/timeline-stats
// @desc    Get temporal statistics for specific seller
// @access  Private/Admin
router.get('/:id/timeline-stats', auth, adminAuth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const sellerId = req.params.id;
    
    // Verificar que el vendedor existe
    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    // Calcular fechas según el período
    const getPeriodStart = (period) => {
      const now = new Date();
      switch(period) {
        case 'week': return new Date(now.setDate(now.getDate() - 7));
        case 'month': return new Date(now.setMonth(now.getMonth() - 1));
        case 'quarter': return new Date(now.setMonth(now.getMonth() - 3));
        case 'year': return new Date(now.setFullYear(now.getFullYear() - 1));
        default: return new Date(now.setMonth(now.getMonth() - 1));
      }
    };
    
    const startDate = getPeriodStart(period);
    
    // Estadísticas temporales
    const timelineStats = await Lead.aggregate([
      { 
        $match: { 
          assignedTo: seller._id,
          assignedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$assignedAt" }},
          assigned: { $sum: 1 },
          contacted: {
            $sum: {
              $cond: [
                { $ne: ['$status', 'uncontacted'] },
                1,
                0
              ]
            }
          },
          converted: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'won'] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 }}
    ]);
    
    // Estadísticas por status en el período
    const statusBreakdown = await Lead.aggregate([
      { 
        $match: { 
          assignedTo: seller._id,
          assignedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Leads con última actividad
    const recentActivity = await Lead.find({
      assignedTo: seller._id,
      lastContact: { $gte: startDate }
    })
    .select('name status lastContact nextAction notes')
    .sort({ lastContact: -1 })
    .limit(10);
    
    res.json({
      success: true,
      data: {
        seller: {
          id: seller._id,
          name: seller.name,
          username: seller.username
        },
        period,
        timelineStats,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentActivity
      }
    });
    
  } catch (error) {
    console.error('Get timeline stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id/last-access
// @desc    Update user last access time
// @access  Private
router.put('/:id/last-access', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Solo permitir actualizar su propio acceso o ser admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { lastAccess: new Date() },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('Update last access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id/detailed-leads
// @desc    Get detailed leads for specific seller with status history
// @access  Private/Admin
router.get('/:id/detailed-leads', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sortBy = 'updatedAt' } = req.query;
    const sellerId = req.params.id;
    
    // Verificar que el vendedor existe
    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    // Construir filtro
    let filter = { assignedTo: seller._id };
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const skip = (page - 1) * limit;
    const totalLeads = await Lead.countDocuments(filter);
    
    // Obtener leads con detalles completos
    const leads = await Lead.find(filter)
      .populate('statusHistory.changedBy', 'name username')
      .select('name contact phone address status assignedAt lastContact nextAction notes statusHistory createdAt updatedAt')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Enriquecer con información adicional
    const enrichedLeads = leads.map(lead => {
      const lastStatusChange = lead.statusHistory.length > 0 
        ? lead.statusHistory[lead.statusHistory.length - 1]
        : null;
      
      return {
        ...lead.toObject(),
        daysSinceAssigned: Math.floor((new Date() - lead.assignedAt) / (1000 * 60 * 60 * 24)),
        daysSinceLastContact: lead.lastContact 
          ? Math.floor((new Date() - lead.lastContact) / (1000 * 60 * 60 * 24))
          : null,
        lastStatusChange: lastStatusChange ? {
          status: lastStatusChange.status,
          changedAt: lastStatusChange.changedAt,
          changedBy: lastStatusChange.changedBy ? lastStatusChange.changedBy.name : 'Sistema',
          note: lastStatusChange.note
        } : null
      };
    });
    
    res.json({
      success: true,
      data: {
        seller: {
          id: seller._id,
          name: seller.name,
          username: seller.username,
          totalLeads: seller.totalLeads,
          totalContacted: seller.totalContacted,
          lastAccess: seller.lastAccess
        },
        leads: enrichedLeads,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLeads / limit),
          totalLeads,
          hasNext: skip + leads.length < totalLeads,
          hasPrev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get detailed leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/stats/dashboard
// @desc    Get dashboard stats for admin
// @access  Private/Admin
router.get('/stats/dashboard', auth, adminAuth, async (req, res) => {
  try {
    // Estadísticas generales
    const totalUsers = await User.countDocuments({ role: 'seller' });
    const activeUsers = await User.countDocuments({ role: 'seller', isActive: true });
    const totalLeads = await Lead.countDocuments();
    const unassignedLeads = await Lead.countDocuments({ assignedTo: null });

    // Estadísticas por status
    const leadsByStatus = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top vendedores por leads asignados
    const topSellersByLeads = await User.find({ role: 'seller' })
      .select('name username totalLeads totalContacted')
      .sort({ totalLeads: -1 })
      .limit(10);

    // Leads por vendedor (con nombres)
    const leadsByUser = await Lead.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          contacted: {
            $sum: {
              $cond: [
                { $ne: ['$status', 'uncontacted'] },
                1,
                0
              ]
            }
          },
          won: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'won'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          username: '$user.username',
          total: 1,
          contacted: 1,
          won: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$won', '$total'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalSellers: totalUsers,
          activeSellers: activeUsers,
          totalLeads,
          unassignedLeads
        },
        leadsByStatus: leadsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topSellers: topSellersByLeads,
        sellerStats: leadsByUser
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // No permitir eliminar si tiene leads asignados
    const assignedLeads = await Lead.countDocuments({ assignedTo: user._id });
    if (assignedLeads > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with ${assignedLeads} assigned leads. Reassign leads first.`
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;