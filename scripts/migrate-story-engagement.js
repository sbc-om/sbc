/**
 * Migration script to add story engagement tables (views, likes, comments)
 * Run this script if you already have an existing database
 * 
 * Usage: node scripts/migrate-story-engagement.js
 */

import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function migrate() {
  const pool = new pg.Pool({ connectionString });
  
  try {
    console.log('Starting migration for story engagement tables...');
    
    await pool.query(`
      -- Story views (track who viewed each story)
      CREATE TABLE IF NOT EXISTS story_views (
        id TEXT PRIMARY KEY,
        story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(story_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
      CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON story_views(user_id);

      -- Story likes
      CREATE TABLE IF NOT EXISTS story_likes (
        id TEXT PRIMARY KEY,
        story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(story_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON story_likes(story_id);
      CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON story_likes(user_id);

      -- Story comments
      CREATE TABLE IF NOT EXISTS story_comments (
        id TEXT PRIMARY KEY,
        story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
      CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON story_comments(user_id);
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('Tables created: story_views, story_likes, story_comments');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
