#!/usr/bin/env node

/**
 * Database Migration Script - Create Unique Indexes for Lead Model
 * 
 * This script creates unique indexes to prevent duplicate leads in the database.
 * Run this script after updating the Lead model to ensure proper duplicate prevention.
 * 
 * Usage: node scripts/migrate-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function migrateIndexes() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-leads');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const leadsCollection = db.collection('leads');

    console.log('📊 Analyzing existing data for potential duplicates...');
    
    // Check for existing duplicates before creating unique indexes
    const phoneAggregation = await leadsCollection.aggregate([
      { $match: { phone: { $exists: true, $ne: "", $type: "string" } } },
      { $group: { _id: "$phone", count: { $sum: 1 }, docs: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    const urlAggregation = await leadsCollection.aggregate([
      { $match: { googleUrl: { $exists: true, $ne: "", $type: "string" } } },
      { $group: { _id: "$googleUrl", count: { $sum: 1 }, docs: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    const nameAggregation = await leadsCollection.aggregate([
      { 
        $match: { 
          name: { $exists: true, $ne: "", $type: "string" },
          province: { $exists: true, $ne: "", $type: "string" }
        } 
      },
      { $group: { 
        _id: { name: "$name", province: "$province", city: "$city" }, 
        count: { $sum: 1 }, 
        docs: { $push: "$_id" } 
      } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    console.log(`📋 Found duplicates:`);
    console.log(`   - By phone: ${phoneAggregation.length} groups`);
    console.log(`   - By Google URL: ${urlAggregation.length} groups`);
    console.log(`   - By name/province/city: ${nameAggregation.length} groups`);

    // If duplicates exist, offer to remove them
    if (phoneAggregation.length > 0 || urlAggregation.length > 0 || nameAggregation.length > 0) {
      console.log('⚠️  Duplicates found! You need to clean them before creating unique indexes.');
      console.log('');
      console.log('Options:');
      console.log('1. Remove duplicates automatically (keeps the newest by createdAt)');
      console.log('2. Skip index creation (not recommended)');
      console.log('3. Exit and handle manually');
      
      // For now, we'll just report and continue
      console.log('');
      console.log('📝 Detailed duplicate report:');
      
      if (phoneAggregation.length > 0) {
        console.log('🔴 Phone duplicates:');
        phoneAggregation.forEach(dup => {
          console.log(`   - Phone "${dup._id}": ${dup.count} records`);
        });
      }
      
      if (urlAggregation.length > 0) {
        console.log('🔴 Google URL duplicates:');
        urlAggregation.forEach(dup => {
          console.log(`   - URL "${dup._id}": ${dup.count} records`);
        });
      }
      
      if (nameAggregation.length > 0) {
        console.log('🔴 Name/Province/City duplicates:');
        nameAggregation.forEach(dup => {
          console.log(`   - "${dup._id.name}" in ${dup._id.province}, ${dup._id.city || 'N/A'}: ${dup.count} records`);
        });
      }
      
      console.log('');
      console.log('⚡ Auto-cleaning duplicates (keeping newest)...');
      
      let totalRemoved = 0;
      
      // Clean phone duplicates
      for (const dup of phoneAggregation) {
        const docsToKeep = await leadsCollection.find(
          { _id: { $in: dup.docs } }
        ).sort({ createdAt: -1 }).limit(1).toArray();
        
        const docsToRemove = docsToKeep.length > 0 ? 
          dup.docs.filter(id => !docsToKeep[0]._id.equals(id)) : 
          dup.docs.slice(1); // If no documents found, remove all but first
        
        if (docsToRemove.length > 0) {
          await leadsCollection.deleteMany({ _id: { $in: docsToRemove } });
          totalRemoved += docsToRemove.length;
          console.log(`   🗑️  Removed ${docsToRemove.length} duplicate(s) for phone "${dup._id}"`);
        }
      }
      
      // Clean URL duplicates
      for (const dup of urlAggregation) {
        const docsToKeep = await leadsCollection.find(
          { _id: { $in: dup.docs } }
        ).sort({ createdAt: -1 }).limit(1).toArray();
        
        const docsToRemove = docsToKeep.length > 0 ? 
          dup.docs.filter(id => !docsToKeep[0]._id.equals(id)) : 
          dup.docs.slice(1); // If no documents found, remove all but first
        
        if (docsToRemove.length > 0) {
          await leadsCollection.deleteMany({ _id: { $in: docsToRemove } });
          totalRemoved += docsToRemove.length;
          console.log(`   🗑️  Removed ${docsToRemove.length} duplicate(s) for URL "${dup._id}"`);
        }
      }
      
      // Clean name duplicates
      for (const dup of nameAggregation) {
        const docsToKeep = await leadsCollection.find(
          { _id: { $in: dup.docs } }
        ).sort({ createdAt: -1 }).limit(1).toArray();
        
        const docsToRemove = docsToKeep.length > 0 ? 
          dup.docs.filter(id => !docsToKeep[0]._id.equals(id)) : 
          dup.docs.slice(1); // If no documents found, remove all but first
        
        if (docsToRemove.length > 0) {
          await leadsCollection.deleteMany({ _id: { $in: docsToRemove } });
          totalRemoved += docsToRemove.length;
          console.log(`   🗑️  Removed ${docsToRemove.length} duplicate(s) for "${dup._id.name}"`);
        }
      }
      
      console.log(`✅ Cleaned ${totalRemoved} duplicate records`);
    }

    console.log('');
    console.log('🔧 Creating unique indexes...');

    // Drop existing indexes that might conflict
    try {
      console.log('   - Dropping old indexes...');
      await leadsCollection.dropIndex('phone_1_name_1');
      console.log('     ✅ Dropped old phone_1_name_1 index');
    } catch (error) {
      // Index might not exist, continue
      console.log('     ℹ️  Old index phone_1_name_1 not found (ok)');
    }

    // Create new unique indexes
    console.log('   - Creating phone unique index...');
    await leadsCollection.createIndex(
      { phone: 1 }, 
      { 
        unique: true, 
        partialFilterExpression: { phone: { $exists: true, $type: "string" } },
        name: 'phone_unique'
      }
    );
    console.log('     ✅ Created phone unique index');

    console.log('   - Creating Google URL unique index...');
    await leadsCollection.createIndex(
      { googleUrl: 1 }, 
      { 
        unique: true, 
        partialFilterExpression: { googleUrl: { $exists: true, $type: "string" } },
        name: 'googleUrl_unique'
      }
    );
    console.log('     ✅ Created Google URL unique index');

    console.log('   - Creating name/province/city unique index...');
    await leadsCollection.createIndex(
      { name: 1, province: 1, city: 1 }, 
      { 
        unique: true,
        partialFilterExpression: { 
          name: { $exists: true, $type: "string" },
          province: { $exists: true, $type: "string" }
        },
        name: 'name_province_city_unique'
      }
    );
    console.log('     ✅ Created name/province/city unique index');

    // Verify indexes
    console.log('');
    console.log('🔍 Verifying indexes...');
    const indexes = await leadsCollection.indexes();
    const uniqueIndexes = indexes.filter(idx => idx.unique);
    
    console.log(`   📊 Total indexes: ${indexes.length}`);
    console.log(`   🔒 Unique indexes: ${uniqueIndexes.length}`);
    
    uniqueIndexes.forEach(idx => {
      console.log(`     - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('');
    console.log('✅ Database migration completed successfully!');
    console.log('   - Duplicate records cleaned');
    console.log('   - Unique indexes created');
    console.log('   - Import system will now properly detect duplicates');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  migrateIndexes();
}

module.exports = { migrateIndexes };