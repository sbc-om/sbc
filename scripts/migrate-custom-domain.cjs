#!/usr/bin/env node
/**
 * Migration: Add custom_domain column to businesses table
 * 
 * Run: node scripts/migrate-custom-domain.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sbc',
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration: add custom_domain to businesses...\n');
    
    // Check if column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'businesses' AND column_name = 'custom_domain'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Column custom_domain already exists. Nothing to do.');
      return;
    }
    
    // Add the custom_domain column
    await client.query(`
      ALTER TABLE businesses 
      ADD COLUMN custom_domain VARCHAR(255) UNIQUE
    `);
    
    console.log('✅ Added custom_domain column to businesses table');
    
    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_custom_domain 
      ON businesses(custom_domain) 
      WHERE custom_domain IS NOT NULL
    `);
    
    console.log('✅ Created index on custom_domain column');
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
