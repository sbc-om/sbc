import { nanoid } from "nanoid";
import { query, transaction } from "./postgres";
import type { LoyaltyCardTemplate, LoyaltyIssuedCard } from "./types";

// ==================== Card Templates ====================

type LoyaltyTemplateRow = {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean | null;
  design: LoyaltyCardTemplate["design"] | null;
  pass_content: LoyaltyCardTemplate["passContent"] | null;
  barcode: LoyaltyCardTemplate["barcode"] | null;
  images: LoyaltyCardTemplate["images"] | null;
  support: LoyaltyCardTemplate["support"] | null;
  terms: string | null;
  description: string | null;
  notification_title: string | null;
  notification_body: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type LoyaltyIssuedCardRow = {
  id: string;
  user_id: string;
  template_id: string;
  customer_id: string;
  points: number | null;
  status: LoyaltyIssuedCard["status"] | null;
  member_id: string;
  overrides: LoyaltyIssuedCard["overrides"] | null;
  google_save_url: string | null;
  apple_registered: boolean | null;
  last_points_update: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type LoyaltyIssuedCardWithTemplateRow = LoyaltyIssuedCardRow & {
  t_id: string;
  t_user_id: string;
  t_name: string;
  t_is_default: boolean | null;
  t_design: LoyaltyCardTemplate["design"] | null;
  t_pass_content: LoyaltyCardTemplate["passContent"] | null;
  t_barcode: LoyaltyCardTemplate["barcode"] | null;
  t_images: LoyaltyCardTemplate["images"] | null;
  t_support: LoyaltyCardTemplate["support"] | null;
  t_terms: string | null;
  t_description: string | null;
  t_notification_title: string | null;
  t_notification_body: string | null;
  t_created_at: Date | null;
  t_updated_at: Date | null;
};

const DEFAULT_CARD_DESIGN: LoyaltyCardTemplate["design"] = {
  primaryColor: "#0f172a",
  secondaryColor: "#1e293b",
  textColor: "#ffffff",
  backgroundColor: "#0f172a",
  backgroundStyle: "solid",
  logoPosition: "top",
  showBusinessName: true,
  showCustomerName: true,
  cornerRadius: 12,
};

const DEFAULT_PASS_CONTENT: LoyaltyCardTemplate["passContent"] = {
  programName: "Loyalty Program",
  pointsLabel: "Points",
};

function rowToTemplate(row: LoyaltyTemplateRow): LoyaltyCardTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isDefault: row.is_default ?? false,
    design: row.design ?? DEFAULT_CARD_DESIGN,
    passContent: row.pass_content ?? DEFAULT_PASS_CONTENT,
    barcode: row.barcode ?? { format: "qr" },
    images: row.images ?? {},
    support: row.support ?? {},
    terms: row.terms ?? undefined,
    description: row.description ?? undefined,
    notificationTitle: row.notification_title ?? undefined,
    notificationBody: row.notification_body ?? undefined,
    createdAt: row.created_at?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * Get all card templates for a user
 */
export async function listLoyaltyCardTemplates(userId: string): Promise<LoyaltyCardTemplate[]> {
  const result = await query<LoyaltyTemplateRow>(
    `SELECT * FROM loyalty_card_templates WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return result.rows.map(rowToTemplate);
}

/**
 * Get a single card template by ID
 */
export async function getLoyaltyCardTemplateById(id: string): Promise<LoyaltyCardTemplate | null> {
  const result = await query<LoyaltyTemplateRow>(`SELECT * FROM loyalty_card_templates WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToTemplate(result.rows[0]) : null;
}

/**
 * Get the default card template for a user
 */
export async function getDefaultLoyaltyCardTemplate(userId: string): Promise<LoyaltyCardTemplate | null> {
  const result = await query<LoyaltyTemplateRow>(
    `SELECT * FROM loyalty_card_templates WHERE user_id = $1 AND is_default = true LIMIT 1`,
    [userId]
  );
  if (result.rows.length > 0) return rowToTemplate(result.rows[0]);
  
  // If no default, return the first template
  const fallback = await query<LoyaltyTemplateRow>(
    `SELECT * FROM loyalty_card_templates WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );
  return fallback.rows.length > 0 ? rowToTemplate(fallback.rows[0]) : null;
}

/**
 * Create a new card template
 */
export async function createLoyaltyCardTemplate(input: {
  userId: string;
  name: string;
  isDefault?: boolean;
  design: LoyaltyCardTemplate["design"];
  passContent: LoyaltyCardTemplate["passContent"];
  barcode: LoyaltyCardTemplate["barcode"];
  images?: LoyaltyCardTemplate["images"];
  support?: LoyaltyCardTemplate["support"];
  terms?: string;
  description?: string;
  notificationTitle?: string;
  notificationBody?: string;
}): Promise<LoyaltyCardTemplate> {
  const id = nanoid();
  const now = new Date();

  return await transaction(async (client) => {
    // If this is set as default, unset other defaults first
    if (input.isDefault) {
      await client.query(
        `UPDATE loyalty_card_templates SET is_default = false WHERE user_id = $1`,
        [input.userId]
      );
    }

    const result = await client.query<LoyaltyTemplateRow>(`
      INSERT INTO loyalty_card_templates (
        id, user_id, name, is_default, design, pass_content, barcode, images, support,
        terms, description, notification_title, notification_body, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
      RETURNING *
    `, [
      id,
      input.userId,
      input.name,
      input.isDefault ?? false,
      JSON.stringify(input.design),
      JSON.stringify(input.passContent),
      JSON.stringify(input.barcode),
      JSON.stringify(input.images ?? {}),
      JSON.stringify(input.support ?? {}),
      input.terms,
      input.description,
      input.notificationTitle,
      input.notificationBody,
      now,
    ]);

    return rowToTemplate(result.rows[0]);
  });
}

/**
 * Update an existing card template
 */
export async function updateLoyaltyCardTemplate(
  id: string,
  updates: Partial<Omit<LoyaltyCardTemplate, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<LoyaltyCardTemplate | null> {
  const existing = await getLoyaltyCardTemplateById(id);
  if (!existing) return null;

  const now = new Date();

  return await transaction(async (client) => {
    // If setting as default, unset other defaults first
    if (updates.isDefault) {
      await client.query(
        `UPDATE loyalty_card_templates SET is_default = false WHERE user_id = $1 AND id != $2`,
        [existing.userId, id]
      );
    }

    const result = await client.query<LoyaltyTemplateRow>(`
      UPDATE loyalty_card_templates SET
        name = COALESCE($2, name),
        is_default = COALESCE($3, is_default),
        design = COALESCE($4, design),
        pass_content = COALESCE($5, pass_content),
        barcode = COALESCE($6, barcode),
        images = COALESCE($7, images),
        support = COALESCE($8, support),
        terms = $9,
        description = $10,
        notification_title = $11,
        notification_body = $12,
        updated_at = $13
      WHERE id = $1
      RETURNING *
    `, [
      id,
      updates.name,
      updates.isDefault,
      updates.design ? JSON.stringify(updates.design) : null,
      updates.passContent ? JSON.stringify(updates.passContent) : null,
      updates.barcode ? JSON.stringify(updates.barcode) : null,
      updates.images ? JSON.stringify(updates.images) : null,
      updates.support ? JSON.stringify(updates.support) : null,
      updates.terms ?? existing.terms,
      updates.description ?? existing.description,
      updates.notificationTitle ?? existing.notificationTitle,
      updates.notificationBody ?? existing.notificationBody,
      now,
    ]);

    return rowToTemplate(result.rows[0]);
  });
}

/**
 * Delete a card template
 */
export async function deleteLoyaltyCardTemplate(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM loyalty_card_templates WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ==================== Issued Cards ====================

function rowToIssuedCard(row: LoyaltyIssuedCardRow): LoyaltyIssuedCard {
  return {
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    customerId: row.customer_id,
    points: row.points ?? 0,
    status: row.status ?? "active",
    memberId: row.member_id,
    overrides: row.overrides ?? undefined,
    googleSaveUrl: row.google_save_url ?? undefined,
    appleRegistered: row.apple_registered ?? false,
    lastPointsUpdate: row.last_points_update?.toISOString(),
    createdAt: row.created_at?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * Generate a unique member ID
 */
function generateMemberId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "SBC-";
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += "-";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * List all issued cards for a user (business owner)
 */
export async function listLoyaltyIssuedCards(input: {
  userId: string;
  templateId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<LoyaltyIssuedCard[]> {
  let sql = `SELECT * FROM loyalty_issued_cards WHERE user_id = $1`;
  const params: unknown[] = [input.userId];
  let paramIndex = 2;

  if (input.templateId) {
    sql += ` AND template_id = $${paramIndex++}`;
    params.push(input.templateId);
  }
  if (input.status) {
    sql += ` AND status = $${paramIndex++}`;
    params.push(input.status);
  }

  sql += ` ORDER BY created_at DESC`;

  if (input.limit) {
    sql += ` LIMIT $${paramIndex++}`;
    params.push(input.limit);
  }
  if (input.offset) {
    sql += ` OFFSET $${paramIndex++}`;
    params.push(input.offset);
  }

  const result = await query<LoyaltyIssuedCardRow>(sql, params);
  return result.rows.map(rowToIssuedCard);
}

/**
 * Get an issued card by ID
 */
export async function getLoyaltyIssuedCardById(id: string): Promise<LoyaltyIssuedCard | null> {
  const result = await query<LoyaltyIssuedCardRow>(`SELECT * FROM loyalty_issued_cards WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToIssuedCard(result.rows[0]) : null;
}

/**
 * Get an issued card by customer ID
 */
export async function getLoyaltyIssuedCardByCustomerId(customerId: string): Promise<LoyaltyIssuedCard | null> {
  const result = await query<LoyaltyIssuedCardRow>(`SELECT * FROM loyalty_issued_cards WHERE customer_id = $1`, [customerId]);
  return result.rows.length > 0 ? rowToIssuedCard(result.rows[0]) : null;
}

/**
 * Get an issued card by member ID
 */
export async function getLoyaltyIssuedCardByMemberId(userId: string, memberId: string): Promise<LoyaltyIssuedCard | null> {
  const result = await query<LoyaltyIssuedCardRow>(
    `SELECT * FROM loyalty_issued_cards WHERE user_id = $1 AND member_id = $2`,
    [userId, memberId]
  );
  return result.rows.length > 0 ? rowToIssuedCard(result.rows[0]) : null;
}

/**
 * Issue a new card to a customer
 */
export async function issueNewLoyaltyCard(input: {
  userId: string;
  templateId: string;
  customerId: string;
  initialPoints?: number;
  memberId?: string;
  overrides?: LoyaltyIssuedCard["overrides"];
}): Promise<LoyaltyIssuedCard> {
  const id = nanoid();
  const now = new Date();
  const memberId = input.memberId || generateMemberId();

  const result = await query<LoyaltyIssuedCardRow>(`
    INSERT INTO loyalty_issued_cards (
      id, user_id, template_id, customer_id, points, status, member_id, overrides,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $8)
    RETURNING *
  `, [
    id,
    input.userId,
    input.templateId,
    input.customerId,
    input.initialPoints ?? 0,
    memberId,
    input.overrides ? JSON.stringify(input.overrides) : null,
    now,
  ]);

  return rowToIssuedCard(result.rows[0]);
}

/**
 * Update points on an issued card
 */
export async function updateIssuedCardPoints(
  cardId: string,
  points: number
): Promise<LoyaltyIssuedCard | null> {
  const now = new Date();
  const result = await query<LoyaltyIssuedCardRow>(`
    UPDATE loyalty_issued_cards 
    SET points = $2, last_points_update = $3, updated_at = $3
    WHERE id = $1
    RETURNING *
  `, [cardId, points, now]);

  return result.rows.length > 0 ? rowToIssuedCard(result.rows[0]) : null;
}

/**
 * Add points to an issued card
 */
export async function addPointsToIssuedCard(
  cardId: string,
  pointsToAdd: number
): Promise<LoyaltyIssuedCard | null> {
  const now = new Date();
  const result = await query<LoyaltyIssuedCardRow>(`
    UPDATE loyalty_issued_cards 
    SET points = points + $2, last_points_update = $3, updated_at = $3
    WHERE id = $1
    RETURNING *
  `, [cardId, pointsToAdd, now]);

  return result.rows.length > 0 ? rowToIssuedCard(result.rows[0]) : null;
}

/**
 * Deduct points from an issued card
 */
export async function deductPointsFromIssuedCard(
  cardId: string,
  pointsToDeduct: number
): Promise<LoyaltyIssuedCard | null> {
  const now = new Date();
  const result = await query<LoyaltyIssuedCardRow>(`
    UPDATE loyalty_issued_cards 
    SET points = GREATEST(0, points - $2), last_points_update = $3, updated_at = $3
    WHERE id = $1
    RETURNING *
  `, [cardId, pointsToDeduct, now]);

  return result.rows.length > 0 ? rowToIssuedCard(result.rows[0]) : null;
}

/**
 * Update issued card status
 */
export async function updateIssuedCardStatus(
  cardId: string,
  status: LoyaltyIssuedCard["status"]
): Promise<LoyaltyIssuedCard | null> {
  const now = new Date();
  const result = await query<LoyaltyIssuedCardRow>(`
    UPDATE loyalty_issued_cards 
    SET status = $2, updated_at = $3
    WHERE id = $1
    RETURNING *
  `, [cardId, status, now]);

  return result.rows.length > 0 ? rowToIssuedCard(result.rows[0]) : null;
}

/**
 * Update Google save URL for an issued card
 */
export async function updateIssuedCardGoogleSaveUrl(
  cardId: string,
  googleSaveUrl: string
): Promise<void> {
  const now = new Date();
  await query(`
    UPDATE loyalty_issued_cards 
    SET google_save_url = $2, updated_at = $3
    WHERE id = $1
  `, [cardId, googleSaveUrl, now]);
}

/**
 * Mark card as registered with Apple Wallet
 */
export async function markIssuedCardAppleRegistered(cardId: string): Promise<void> {
  const now = new Date();
  await query(`
    UPDATE loyalty_issued_cards 
    SET apple_registered = true, updated_at = $2
    WHERE id = $1
  `, [cardId, now]);
}

/**
 * Get count of issued cards for a template
 */
export async function countIssuedCardsForTemplate(templateId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) as count FROM loyalty_issued_cards WHERE template_id = $1`,
    [templateId]
  );
  return parseInt(result.rows[0]?.count ?? "0", 10);
}

/**
 * Get issued card with template data (joined)
 */
export async function getIssuedCardWithTemplate(cardId: string): Promise<{
  card: LoyaltyIssuedCard;
  template: LoyaltyCardTemplate;
} | null> {
  const result = await query<LoyaltyIssuedCardWithTemplateRow>(`
    SELECT 
      c.*,
      t.id as t_id, t.user_id as t_user_id, t.name as t_name, t.is_default as t_is_default,
      t.design as t_design, t.pass_content as t_pass_content, t.barcode as t_barcode,
      t.images as t_images, t.support as t_support, t.terms as t_terms,
      t.description as t_description, t.notification_title as t_notification_title,
      t.notification_body as t_notification_body, t.created_at as t_created_at,
      t.updated_at as t_updated_at
    FROM loyalty_issued_cards c
    JOIN loyalty_card_templates t ON c.template_id = t.id
    WHERE c.id = $1
  `, [cardId]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    card: rowToIssuedCard(row),
    template: {
      id: row.t_id,
      userId: row.t_user_id,
      name: row.t_name,
      isDefault: row.t_is_default ?? false,
      design: row.t_design ?? DEFAULT_CARD_DESIGN,
      passContent: row.t_pass_content ?? DEFAULT_PASS_CONTENT,
      barcode: row.t_barcode ?? { format: "qr" },
      images: row.t_images ?? {},
      support: row.t_support ?? {},
      terms: row.t_terms ?? undefined,
      description: row.t_description ?? undefined,
      notificationTitle: row.t_notification_title ?? undefined,
      notificationBody: row.t_notification_body ?? undefined,
      createdAt: row.t_created_at?.toISOString() ?? new Date().toISOString(),
      updatedAt: row.t_updated_at?.toISOString() ?? new Date().toISOString(),
    },
  };
}
