/**
 * Create an admin user in PostgreSQL
 * Usage: node scripts/create-admin.js [email] [password]
 */
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const email = process.argv[2] || "admin@sbc.com";
const password = process.argv[3] || "admin123";

async function main() {
  const pool = new pg.Pool({ connectionString });

  try {
    // Check if user already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      console.log(`User ${email} already exists with ID: ${existing.rows[0].id}`);
      return;
    }

    // Create admin user
    const id = nanoid();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    await pool.query(`
      INSERT INTO users (
        id, email, full_name, password_hash, role, is_active, is_verified,
        display_name, approval_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
    `, [
      id,
      email,
      "Admin User",
      passwordHash,
      "admin",
      true,
      true,
      "Admin",
      "approved",
      now
    ]);

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID: ${id}`);
  } catch (error) {
    console.error("Error creating admin user:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
