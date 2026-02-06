/**
 * PostgreSQL Database Module
 * Pure async PostgreSQL with raw SQL
 */
import pg from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __sbcPgPool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var __sbcDbInitialized: boolean | undefined;
}

const connectionString = process.env.DATABASE_URL;

export function getPool(): pg.Pool {
  if (!globalThis.__sbcPgPool) {
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    globalThis.__sbcPgPool = new pg.Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased from 2s to 10s for cold starts
    });
  }
  return globalThis.__sbcPgPool;
}

// Promise for schema initialization (acts as a mutex)
let schemaInitPromise: Promise<void> | null = null;

/**
 * Ensure database schema is initialized
 */
async function ensureSchema(): Promise<void> {
  if (globalThis.__sbcDbInitialized) return;
  
  // Use a single promise to prevent concurrent initialization
  if (!schemaInitPromise) {
    schemaInitPromise = doEnsureSchema();
  }
  await schemaInitPromise;
}

async function doEnsureSchema(): Promise<void> {
  if (globalThis.__sbcDbInitialized) return;
  
  const pool = getPool();
  // Use a simple check to see if tables exist
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    )
  `);
  
  if (!result.rows[0]?.exists) {
    console.log("[DB] Initializing database schema...");
    await runSchemaInit(pool);
    console.log("[DB] Schema initialized successfully");
  }
  
  globalThis.__sbcDbInitialized = true;
}

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  await ensureSchema();
  const pool = getPool();
  return pool.query<T>(text, params);
}

export async function getClient(): Promise<pg.PoolClient> {
  await ensureSchema();
  const pool = getPool();
  return pool.connect();
}

/**
 * Execute a transaction with automatic commit/rollback
 */
export async function transaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Initialize database schema (internal - called automatically on first query)
 */
async function runSchemaInit(pool: pg.Pool): Promise<void> {
  await pool.query(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE,
      username TEXT UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      display_name TEXT,
      bio TEXT,
      avatar_url TEXT,
      approval_status TEXT DEFAULT 'pending',
      approval_reason TEXT,
      approval_requested_at TIMESTAMPTZ,
      approved_at TIMESTAMPTZ,
      pending_email TEXT,
      pending_phone TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      image TEXT,
      icon_id TEXT,
      parent_id TEXT REFERENCES categories(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Businesses table
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      owner_id TEXT REFERENCES users(id),
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description_en TEXT,
      description_ar TEXT,
      is_approved BOOLEAN DEFAULT false,
      is_verified BOOLEAN DEFAULT false,
      is_special BOOLEAN DEFAULT false,
      homepage_featured BOOLEAN DEFAULT false,
      homepage_top BOOLEAN DEFAULT false,
      category TEXT,
      category_id TEXT REFERENCES categories(id),
      city TEXT,
      address TEXT,
      phone TEXT,
      website TEXT,
      email TEXT,
      tags TEXT[],
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      avatar_mode TEXT DEFAULT 'icon',
      media JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Business stories (Instagram-like, 24-hour expiry)
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
      media_url TEXT NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'image',
      caption TEXT,
      view_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stories_business_id ON stories(business_id);
    CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);

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

    -- Business cards table
    CREATE TABLE IF NOT EXISTS business_cards (
      id TEXT PRIMARY KEY,
      business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
      owner_id TEXT REFERENCES users(id),
      full_name TEXT NOT NULL,
      title TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      avatar_url TEXT,
      bio TEXT,
      is_public BOOLEAN DEFAULT true,
      is_approved BOOLEAN DEFAULT false,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- User category follows
    CREATE TABLE IF NOT EXISTS user_category_follows (
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, category_id)
    );

    -- User business likes
    CREATE TABLE IF NOT EXISTS user_business_likes (
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, business_id)
    );

    -- User business saves
    CREATE TABLE IF NOT EXISTS user_business_saves (
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, business_id)
    );

    -- User business follows (follow individual businesses)
    CREATE TABLE IF NOT EXISTS user_business_follows (
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, business_id)
    );

    -- User business unfollows (hide specific businesses even if following their category)
    CREATE TABLE IF NOT EXISTS user_business_unfollows (
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, business_id)
    );

    -- Business comments
    CREATE TABLE IF NOT EXISTS business_comments (
      id TEXT PRIMARY KEY,
      business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      moderated_by_user_id TEXT REFERENCES users(id),
      moderated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Chat conversations
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id TEXT PRIMARY KEY,
      participant_ids TEXT[] NOT NULL,
      last_message_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Chat messages
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT REFERENCES chat_conversations(id) ON DELETE CASCADE,
      sender_id TEXT REFERENCES users(id),
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Business requests
    CREATE TABLE IF NOT EXISTS business_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      business_name TEXT NOT NULL,
      name_en TEXT,
      name_ar TEXT,
      category TEXT,
      category_id TEXT REFERENCES categories(id),
      description TEXT,
      city TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      admin_response TEXT,
      responded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Products (store packages)
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description_en TEXT,
      description_ar TEXT,
      price DECIMAL(10,2) NOT NULL,
      currency TEXT DEFAULT 'OMR',
      program TEXT NOT NULL,
      plan TEXT DEFAULT 'basic',
      duration_days INTEGER,
      features JSONB DEFAULT '[]',
      badges JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Program subscriptions
    CREATE TABLE IF NOT EXISTS program_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT,
      product_slug TEXT,
      program TEXT NOT NULL,
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ NOT NULL,
      is_active BOOLEAN DEFAULT true,
      payment_id TEXT,
      payment_method TEXT,
      amount DECIMAL(10,2) DEFAULT 0,
      currency TEXT DEFAULT 'OMR',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_program_subscriptions_user_id ON program_subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_program_subscriptions_program ON program_subscriptions(program);

    -- Loyalty subscriptions
    CREATE TABLE IF NOT EXISTS loyalty_subscriptions (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Loyalty profiles
    CREATE TABLE IF NOT EXISTS loyalty_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL,
      logo_url TEXT,
      join_code TEXT UNIQUE NOT NULL,
      location JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Loyalty settings
    CREATE TABLE IF NOT EXISTS loyalty_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      points_required_per_redemption INTEGER DEFAULT 10,
      points_deduct_per_redemption INTEGER DEFAULT 10,
      points_icon_mode TEXT DEFAULT 'logo',
      points_icon_url TEXT,
      card_design JSONB,
      wallet_pass_description TEXT,
      wallet_pass_terms TEXT,
      wallet_website_url TEXT,
      wallet_support_email TEXT,
      wallet_support_phone TEXT,
      wallet_address TEXT,
      wallet_barcode_format TEXT DEFAULT 'qr',
      wallet_barcode_message TEXT,
      wallet_notification_title TEXT,
      wallet_notification_body TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Loyalty customers
    CREATE TABLE IF NOT EXISTS loyalty_customers (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      business_id TEXT,
      full_name TEXT NOT NULL,
      member_id TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      notes TEXT,
      tags TEXT[],
      card_id TEXT,
      points INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, member_id)
    );

    -- Loyalty cards
    CREATE TABLE IF NOT EXISTS loyalty_cards (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES loyalty_customers(id) ON DELETE CASCADE,
      business_id TEXT,
      status TEXT DEFAULT 'active',
      points INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Loyalty messages
    CREATE TABLE IF NOT EXISTS loyalty_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      customer_id TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Loyalty push subscriptions
    CREATE TABLE IF NOT EXISTS loyalty_push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES loyalty_customers(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      keys JSONB NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- User push subscriptions
    CREATE TABLE IF NOT EXISTS user_push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      keys JSONB NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Contact messages
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      locale TEXT DEFAULT 'en',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read_at TIMESTAMPTZ
    );

    -- Apple Wallet registrations
    CREATE TABLE IF NOT EXISTS apple_wallet_registrations (
      id TEXT PRIMARY KEY,
      pass_type_identifier TEXT NOT NULL,
      serial_number TEXT NOT NULL,
      device_library_identifier TEXT NOT NULL,
      push_token TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(pass_type_identifier, serial_number, device_library_identifier)
    );

    -- Passkey credentials
    CREATE TABLE IF NOT EXISTS passkey_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      public_key TEXT NOT NULL,
      counter INTEGER DEFAULT 0,
      transports TEXT[],
      device_type TEXT,
      backed_up BOOLEAN DEFAULT false,
      label TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ
    );

    -- Passkey challenges
    CREATE TABLE IF NOT EXISTS passkey_challenges (
      id TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      user_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses(category_id);
    CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
    CREATE INDEX IF NOT EXISTS idx_businesses_is_approved ON businesses(is_approved);
    CREATE INDEX IF NOT EXISTS idx_business_cards_business_id ON business_cards(business_id);
    CREATE INDEX IF NOT EXISTS idx_business_cards_owner_id ON business_cards(owner_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_customers_user_id ON loyalty_customers(user_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_cards_user_id ON loyalty_cards(user_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer_id ON loyalty_cards(customer_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_user_business_likes_business_id ON user_business_likes(business_id);
    CREATE INDEX IF NOT EXISTS idx_user_business_saves_business_id ON user_business_saves(business_id);
    CREATE INDEX IF NOT EXISTS idx_user_business_follows_business_id ON user_business_follows(business_id);
    CREATE INDEX IF NOT EXISTS idx_user_business_follows_user_id ON user_business_follows(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_business_unfollows_business_id ON user_business_unfollows(business_id);
    CREATE INDEX IF NOT EXISTS idx_user_business_unfollows_user_id ON user_business_unfollows(user_id);

    -- Migrations: Add username column to users table if not exists
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username TEXT UNIQUE;
      END IF;
    END $$;

    -- Migrations: Add show_similar_businesses column to businesses table if not exists
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'show_similar_businesses') THEN
        ALTER TABLE businesses ADD COLUMN show_similar_businesses BOOLEAN DEFAULT true;
      END IF;
    END $$;

    -- OTP codes table for WhatsApp authentication
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'login',
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      verified BOOLEAN DEFAULT false,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
    CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

    -- Wallets table (account_number is user's phone)
    CREATE TABLE IF NOT EXISTS wallets (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance DECIMAL(15, 3) NOT NULL DEFAULT 0,
      account_number TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_wallets_account_number ON wallets(account_number);

    -- Wallet transactions table
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      wallet_user_id TEXT REFERENCES wallets(user_id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount DECIMAL(15, 3) NOT NULL,
      balance_before DECIMAL(15, 3) NOT NULL,
      balance_after DECIMAL(15, 3) NOT NULL,
      related_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      related_phone TEXT,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_user_id ON wallet_transactions(wallet_user_id);
    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

    -- Withdrawal requests table
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(15, 3) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
    CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

    -- App settings table for admin configurations
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Store orders table
    CREATE TABLE IF NOT EXISTS store_orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT NOT NULL DEFAULT 'wallet',
      subtotal DECIMAL(15, 3) NOT NULL DEFAULT 0,
      total DECIMAL(15, 3) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'OMR',
      wallet_transaction_id TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_store_orders_user_id ON store_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders(status);
    CREATE INDEX IF NOT EXISTS idx_store_orders_created_at ON store_orders(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_store_orders_order_number ON store_orders(order_number);

    -- Store order items table
    CREATE TABLE IF NOT EXISTS store_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT REFERENCES store_orders(id) ON DELETE CASCADE,
      product_id TEXT,
      product_slug TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(15, 3) NOT NULL,
      total DECIMAL(15, 3) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'OMR',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_store_order_items_order_id ON store_order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_store_order_items_product_id ON store_order_items(product_id);

    -- Insert default settings if not exists
    INSERT INTO app_settings (key, value) 
    VALUES ('whatsapp_login_enabled', 'true'::jsonb)
    ON CONFLICT (key) DO NOTHING;

    INSERT INTO app_settings (key, value) 
    VALUES ('whatsapp_registration_verification', 'true'::jsonb)
    ON CONFLICT (key) DO NOTHING;

    -- Loyalty card templates table
    CREATE TABLE IF NOT EXISTS loyalty_card_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      is_default BOOLEAN DEFAULT false,
      design JSONB NOT NULL,
      pass_content JSONB NOT NULL,
      barcode JSONB NOT NULL,
      images JSONB,
      support JSONB,
      terms TEXT,
      description TEXT,
      notification_title TEXT,
      notification_body TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_loyalty_card_templates_user_id ON loyalty_card_templates(user_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_card_templates_is_default ON loyalty_card_templates(is_default);

    -- Loyalty issued cards table
    CREATE TABLE IF NOT EXISTS loyalty_issued_cards (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      template_id TEXT REFERENCES loyalty_card_templates(id) ON DELETE SET NULL,
      customer_id TEXT REFERENCES loyalty_customers(id) ON DELETE CASCADE,
      points INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      member_id TEXT NOT NULL,
      overrides JSONB,
      google_save_url TEXT,
      apple_registered BOOLEAN DEFAULT false,
      last_points_update TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, member_id)
    );
    CREATE INDEX IF NOT EXISTS idx_loyalty_issued_cards_user_id ON loyalty_issued_cards(user_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_issued_cards_template_id ON loyalty_issued_cards(template_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_issued_cards_customer_id ON loyalty_issued_cards(customer_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_issued_cards_status ON loyalty_issued_cards(status);

    -- Create SBC Treasury system user if not exists
    INSERT INTO users (id, email, phone, full_name, password_hash, role, is_active, is_verified, display_name, approval_status, created_at, updated_at)
    VALUES ('sbc-treasury', 'treasury@sbc.om', 'sbc', 'SBC Treasury', '$2b$10$placeholder', 'system', true, true, 'SBC Treasury', 'approved', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Create SBC Treasury wallet if not exists
    INSERT INTO wallets (user_id, balance, account_number, created_at, updated_at)
    VALUES ('sbc-treasury', 0, 'sbc', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
  `);
}

/**
 * Manually initialize schema (optional - schema is auto-initialized on first query)
 */
export async function initSchema(): Promise<void> {
  await ensureSchema();
}

// Export pool for direct use if needed
export { pg };
