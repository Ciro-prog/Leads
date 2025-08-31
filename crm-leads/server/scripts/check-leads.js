#!/usr/bin/env node

/**
 * Check Leads Count Script
 * Quick script to verify how many leads are in the database
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function checkLeads() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-leads');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const leadsCollection = db.collection('leads');

    // Count total leads
    const totalCount = await leadsCollection.countDocuments();
    console.log(`📊 Total leads in database: ${totalCount}`);

    if (totalCount > 0) {
      // Sample some leads
      const sampleLeads = await leadsCollection.find({}).limit(5).toArray();
      console.log('\n📋 Sample leads:');
      sampleLeads.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.name} - ${lead.phone || 'N/A'} - ${lead.province || 'N/A'}`);
      });

      // Count by status
      const statusAggregation = await leadsCollection.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      console.log('\n📈 Leads by status:');
      statusAggregation.forEach(stat => {
        console.log(`   - ${stat._id || 'undefined'}: ${stat.count}`);
      });

      // Count assigned vs unassigned
      const assignedCount = await leadsCollection.countDocuments({ assignedTo: { $ne: null } });
      const unassignedCount = await leadsCollection.countDocuments({ assignedTo: null });
      
      console.log('\n👥 Assignment status:');
      console.log(`   - Assigned: ${assignedCount}`);
      console.log(`   - Unassigned: ${unassignedCount}`);

      // Check for any leads with missing required fields
      const missingName = await leadsCollection.countDocuments({ $or: [{ name: { $exists: false } }, { name: '' }] });
      const missingProvince = await leadsCollection.countDocuments({ $or: [{ province: { $exists: false } }, { province: '' }] });
      
      console.log('\n⚠️  Data quality:');
      console.log(`   - Missing name: ${missingName}`);
      console.log(`   - Missing province: ${missingProvince}`);
    } else {
      console.log('\n❌ No leads found in database!');
      console.log('   This could be why the leads view is empty.');
      console.log('   You may need to import some data.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  checkLeads();
}

module.exports = { checkLeads };