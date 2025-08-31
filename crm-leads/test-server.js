// Test script to verify dependencies without starting server
require('dotenv').config();

console.log('🔍 Testing CRM dependencies...');

try {
  // Test all main dependencies
  const express = require('express');
  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const multer = require('multer');
  const csv = require('csv-parser');
  const cors = require('cors');
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const cookieParser = require('cookie-parser');
  const { body, validationResult } = require('express-validator');
  
  console.log('✅ express - OK');
  console.log('✅ mongoose - OK');
  console.log('✅ bcryptjs - OK');
  console.log('✅ jsonwebtoken - OK');
  console.log('✅ multer - OK');
  console.log('✅ csv-parser - OK');
  console.log('✅ cors - OK');
  console.log('✅ helmet - OK');
  console.log('✅ express-rate-limit - OK');
  console.log('✅ cookie-parser - OK');
  console.log('✅ express-validator - OK');
  
  console.log('\n🎉 All dependencies loaded successfully!');
  console.log('🔧 Dependencies issue resolved.');
  console.log('\n📝 Note: Server failed to start due to port 3000 already in use.');
  console.log('💡 Solution: Kill existing process on port 3000 or use different port.');
  
  process.exit(0);
  
} catch (error) {
  console.error('❌ Dependency test failed:', error.message);
  process.exit(1);
}