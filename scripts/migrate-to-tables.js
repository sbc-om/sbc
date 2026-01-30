#!/usr/bin/env node
/**
 * Migrate data from LMDB (kv_store) to proper PostgreSQL tables
 * Run: DATABASE_URL=... node scripts/migrate-to-tables.js
 */
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL env var.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

async function main() {
  const client = await pool.connect();
  
  try {
    // First, create the proper schema
    console.log("Creating schema...");
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE,
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

      CREATE TABLE IF NOT EXISTS user_category_follows (
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, category_id)
      );

      CREATE TABLE IF NOT EXISTS user_business_likes (
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, business_id)
      );

      CREATE TABLE IF NOT EXISTS user_business_saves (
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, business_id)
      );

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

      CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        participant_ids TEXT[] NOT NULL,
        last_message_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES chat_conversations(id) ON DELETE CASCADE,
        sender_id TEXT REFERENCES users(id),
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS business_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        business_name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        description_en TEXT,
        description_ar TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        program TEXT NOT NULL,
        duration_days INTEGER,
        features JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

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
        currency TEXT DEFAULT 'USD',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_program_subscriptions_user_id ON program_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_program_subscriptions_program ON program_subscriptions(program);

      CREATE TABLE IF NOT EXISTS loyalty_subscriptions (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS loyalty_profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        business_name TEXT NOT NULL,
        logo_url TEXT,
        join_code TEXT UNIQUE NOT NULL,
        location JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

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

      CREATE TABLE IF NOT EXISTS loyalty_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        customer_id TEXT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

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

      CREATE TABLE IF NOT EXISTS user_push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        keys JSONB NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

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

      CREATE TABLE IF NOT EXISTS apple_wallet_registrations (
        id TEXT PRIMARY KEY,
        pass_type_identifier TEXT NOT NULL,
        serial_number TEXT NOT NULL,
        device_library_identifier TEXT NOT NULL,
        push_token TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(pass_type_identifier, serial_number, device_library_identifier)
      );

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

      CREATE TABLE IF NOT EXISTS passkey_challenges (
        id TEXT PRIMARY KEY,
        challenge TEXT NOT NULL,
        user_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );

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
    `);
    console.log("Schema created.");

    // Now migrate data from kv_store
    console.log("Migrating data from kv_store...");

    // Users
    const usersRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'users'`);
    for (const row of usersRes.rows) {
      const u = row.value_json;
      if (!u || !u.id) continue;
      await client.query(`
        INSERT INTO users (id, email, phone, full_name, password_hash, role, is_active, is_verified,
          display_name, bio, avatar_url, approval_status, approval_reason, approval_requested_at,
          approved_at, pending_email, pending_phone, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO NOTHING
      `, [
        u.id, u.email, u.phone, u.fullName, u.passwordHash, u.role || 'user',
        u.isActive !== false, u.isVerified || false, u.displayName, u.bio, u.avatarUrl,
        u.approvalStatus, u.approvalReason, u.approvalRequestedAt, u.approvedAt,
        u.pendingEmail, u.pendingPhone, u.createdAt, u.updatedAt
      ]);
    }
    console.log(`Migrated ${usersRes.rowCount} users`);

    // Categories (without parent_id first, then update)
    const catsRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'categories'`);
    for (const row of catsRes.rows) {
      const c = row.value_json;
      if (!c || !c.id) continue;
      await client.query(`
        INSERT INTO categories (id, slug, name_en, name_ar, image, icon_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [
        c.id, c.slug, c.name?.en || '', c.name?.ar || '', c.image, c.iconId,
        c.createdAt, c.updatedAt
      ]);
    }
    // Update parent_id in second pass
    for (const row of catsRes.rows) {
      const c = row.value_json;
      if (!c || !c.parentId) continue;
      await client.query(`UPDATE categories SET parent_id = $1 WHERE id = $2`, [c.parentId, c.id]);
    }
    console.log(`Migrated ${catsRes.rowCount} categories`);

    // Businesses
    const bizRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'businesses'`);
    for (const row of bizRes.rows) {
      const b = row.value_json;
      if (!b || !b.id) continue;
      await client.query(`
        INSERT INTO businesses (id, slug, username, owner_id, name_en, name_ar, description_en, description_ar,
          is_approved, is_verified, is_special, homepage_featured, homepage_top, category, category_id,
          city, address, phone, website, email, tags, latitude, longitude, avatar_mode, media, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
        ON CONFLICT (id) DO NOTHING
      `, [
        b.id, b.slug, b.username, b.ownerId, b.name?.en || '', b.name?.ar || '',
        b.description?.en, b.description?.ar, b.isApproved || false, b.isVerified || false,
        b.isSpecial || false, b.homepageFeatured || false, b.homepageTop || false,
        b.category, b.categoryId, b.city, b.address, b.phone, b.website, b.email,
        b.tags || [], b.latitude, b.longitude, b.avatarMode || 'icon',
        JSON.stringify(b.media || {}), b.createdAt, b.updatedAt
      ]);
    }
    console.log(`Migrated ${bizRes.rowCount} businesses`);

    // Business Cards
    const cardsRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'businessCards'`);
    for (const row of cardsRes.rows) {
      const c = row.value_json;
      if (!c || !c.id) continue;
      await client.query(`
        INSERT INTO business_cards (id, business_id, owner_id, full_name, title, email, phone, website,
          avatar_url, bio, is_public, is_approved, approved_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
      `, [
        c.id, c.businessId, c.ownerId, c.fullName, c.title, c.email, c.phone, c.website,
        c.avatarUrl, c.bio, c.isPublic !== false, c.isApproved || false, c.approvedAt,
        c.createdAt, c.updatedAt
      ]);
    }
    console.log(`Migrated ${cardsRes.rowCount} business cards`);

    // User likes
    const likesRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'userBusinessLikes'`);
    for (const row of likesRes.rows) {
      const parts = row.key.split(':');
      if (parts.length !== 2) continue;
      const [userId, businessId] = parts;
      await client.query(`
        INSERT INTO user_business_likes (user_id, business_id, created_at)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [userId, businessId, row.value_json || new Date().toISOString()]);
    }
    console.log(`Migrated ${likesRes.rowCount} likes`);

    // User saves
    const savesRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'userBusinessSaves'`);
    for (const row of savesRes.rows) {
      const parts = row.key.split(':');
      if (parts.length !== 2) continue;
      const [userId, businessId] = parts;
      await client.query(`
        INSERT INTO user_business_saves (user_id, business_id, created_at)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [userId, businessId, row.value_json || new Date().toISOString()]);
    }
    console.log(`Migrated ${savesRes.rowCount} saves`);

    // Products
    const prodsRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'products'`);
    for (const row of prodsRes.rows) {
      const p = row.value_json;
      if (!p || !p.id) continue;
      await client.query(`
        INSERT INTO products (id, slug, name_en, name_ar, description_en, description_ar, price, currency,
          program, duration_days, features, is_active, sort_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
      `, [
        p.id, p.slug, p.name?.en || '', p.name?.ar || '', p.description?.en, p.description?.ar,
        p.price || 0, p.currency || 'USD', p.program || 'directory', p.durationDays,
        JSON.stringify(p.features || []), p.isActive !== false, p.sortOrder || 0,
        p.createdAt, p.updatedAt
      ]);
    }
    console.log(`Migrated ${prodsRes.rowCount} products`);

    // Loyalty customers
    const custRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'loyaltyCustomers'`);
    for (const row of custRes.rows) {
      const c = row.value_json;
      if (!c || !c.id) continue;
      await client.query(`
        INSERT INTO loyalty_customers (id, user_id, business_id, full_name, member_id, phone, email,
          notes, tags, card_id, points, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [
        c.id, c.userId, c.businessId, c.fullName, c.memberId, c.phone, c.email,
        c.notes, c.tags || [], c.cardId, c.points || 0, c.createdAt, c.updatedAt
      ]);
    }
    console.log(`Migrated ${custRes.rowCount} loyalty customers`);

    // Loyalty cards
    const lCardsRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'loyaltyCards'`);
    for (const row of lCardsRes.rows) {
      const c = row.value_json;
      if (!c || !c.id) continue;
      await client.query(`
        INSERT INTO loyalty_cards (id, user_id, customer_id, business_id, status, points, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [
        c.id, c.userId, c.customerId, c.businessId, c.status || 'active',
        c.points || 0, c.createdAt, c.updatedAt
      ]);
    }
    console.log(`Migrated ${lCardsRes.rowCount} loyalty cards`);

    // Loyalty profiles
    const profRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'loyaltyProfiles'`);
    for (const row of profRes.rows) {
      const p = row.value_json;
      if (!p || !p.userId) continue;
      await client.query(`
        INSERT INTO loyalty_profiles (user_id, business_name, logo_url, join_code, location, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO NOTHING
      `, [
        p.userId, p.businessName, p.logoUrl, p.joinCode,
        p.location ? JSON.stringify(p.location) : null, p.createdAt, p.updatedAt
      ]);
    }
    console.log(`Migrated ${profRes.rowCount} loyalty profiles`);

    // Loyalty settings
    const setRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'loyaltySettings'`);
    for (const row of setRes.rows) {
      const s = row.value_json;
      if (!s || !s.userId) continue;
      await client.query(`
        INSERT INTO loyalty_settings (user_id, points_required_per_redemption, points_deduct_per_redemption,
          points_icon_mode, points_icon_url, card_design, wallet_pass_description, wallet_pass_terms,
          wallet_website_url, wallet_support_email, wallet_support_phone, wallet_address,
          wallet_barcode_format, wallet_barcode_message, wallet_notification_title, wallet_notification_body,
          created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (user_id) DO NOTHING
      `, [
        s.userId, s.pointsRequiredPerRedemption || 10, s.pointsDeductPerRedemption || 10,
        s.pointsIconMode || 'logo', s.pointsIconUrl, s.cardDesign ? JSON.stringify(s.cardDesign) : null,
        s.walletPassDescription, s.walletPassTerms, s.walletWebsiteUrl, s.walletSupportEmail,
        s.walletSupportPhone, s.walletAddress, s.walletBarcodeFormat || 'qr', s.walletBarcodeMessage,
        s.walletNotificationTitle, s.walletNotificationBody, s.createdAt, s.updatedAt
      ]);
    }
    console.log(`Migrated ${setRes.rowCount} loyalty settings`);

    // Loyalty messages
    const msgRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'loyaltyMessages'`);
    for (const row of msgRes.rows) {
      const m = row.value_json;
      if (!m || !m.id) continue;
      await client.query(`
        INSERT INTO loyalty_messages (id, user_id, customer_id, title, body, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [m.id, m.userId, m.customerId, m.title, m.body, m.createdAt]);
    }
    console.log(`Migrated ${msgRes.rowCount} loyalty messages`);

    // Contact messages
    const contRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'contactMessages'`);
    for (const row of contRes.rows) {
      const c = row.value_json;
      if (!c || !c.id) continue;
      await client.query(`
        INSERT INTO contact_messages (id, name, email, subject, message, locale, is_read, created_at, read_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        c.id, c.name, c.email, c.subject, c.message, c.locale || 'en',
        c.isRead || false, c.createdAt, c.readAt
      ]);
    }
    console.log(`Migrated ${contRes.rowCount} contact messages`);

    // Passkey credentials
    const pkRes = await client.query(`SELECT key, value_json FROM kv_store WHERE namespace = 'passkeyCredentials'`);
    for (const row of pkRes.rows) {
      const p = row.value_json;
      if (!p || !p.id) continue;
      await client.query(`
        INSERT INTO passkey_credentials (id, user_id, public_key, counter, transports, device_type,
          backed_up, label, created_at, last_used_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [
        p.id, p.userId, p.publicKey, p.counter || 0, p.transports, p.deviceType,
        p.backedUp || false, p.label, p.createdAt, p.lastUsedAt
      ]);
    }
    console.log(`Migrated ${pkRes.rowCount} passkey credentials`);

    console.log("\nMigration complete! You can now drop the kv_store table if desired:");
    console.log("  DROP TABLE kv_store;");

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
