#!/usr/bin/env node
/**
 * Database Setup Script
 * Runs schema.sql against Railway PostgreSQL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Get DATABASE_URL from Railway (you'll paste it below)
const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not provided!');
  console.error('Usage: node setup-db.js "postgresql://..."');
  console.error('Or: DATABASE_URL="postgresql://..." node setup-db.js');
  process.exit(1);
}

async function setupDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Railway uses SSL
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'backend/src/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Running schema.sql...');
    await client.query(schema);
    console.log('✅ Database schema created!');

    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
