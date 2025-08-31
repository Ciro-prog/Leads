const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user inactive.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Middleware para verificar rol de administrador
const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// Middleware para verificar que el vendedor solo acceda a sus leads
const sellerAuth = (req, res, next) => {
  if (req.user.role === 'admin') {
    // Admin puede acceder a todo
    return next();
  }
  
  if (req.user.role === 'seller') {
    // Agregar filtro para que solo vea sus leads
    req.sellerFilter = { assignedTo: req.user._id };
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied.' 
  });
};

// Generar JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

module.exports = {
  auth,
  adminAuth,
  sellerAuth,
  generateToken
};