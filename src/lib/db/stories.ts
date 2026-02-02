import { nanoid } from "nanoid";
import { query } from "./postgres";

export type Story = {
  id: string;
  businessId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
};

export type StoryWithBusiness = Story & {
  businessName: { en: string; ar: string };
  businessAvatar: string | null;
  businessUsername: string | null;
};

export type BusinessWithStories = {
  businessId: string;
  businessName: { en: string; ar: string };
  businessAvatar: string | null;
  businessUsername: string | null;
  stories: Story[];
  hasUnviewed: boolean;
};

function rowToStory(row: any): Story {
  return {
    id: row.id,
    businessId: row.business_id,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    caption: row.caption,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    expiresAt: row.expires_at?.toISOString() || new Date().toISOString(),
    viewCount: row.view_count || 0,
  };
}

function rowToStoryWithBusiness(row: any): StoryWithBusiness {
  // media is stored as JSONB, extract logo from it
  const media = row.media || {};
  return {
    ...rowToStory(row),
    businessName: { en: row.name_en || "", ar: row.name_ar || "" },
    businessAvatar: media.logo || null,
    businessUsername: row.username,
  };
}

/**
 * Create a new story
 */
export async function createStory(input: {
  businessId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
}): Promise<Story> {
  const id = nanoid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  const result = await query(`
    INSERT INTO stories (id, business_id, media_url, media_type, caption, created_at, expires_at, view_count)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
    RETURNING *
  `, [id, input.businessId, input.mediaUrl, input.mediaType, input.caption || null, now, expiresAt]);

  return rowToStory(result.rows[0]);
}

/**
 * Get a story by ID
 */
export async function getStoryById(id: string): Promise<Story | null> {
  const result = await query(`SELECT * FROM stories WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToStory(result.rows[0]) : null;
}

/**
 * Get all active stories for a business (not expired)
 */
export async function getActiveStoriesByBusiness(businessId: string): Promise<Story[]> {
  const result = await query(`
    SELECT * FROM stories 
    WHERE business_id = $1 AND expires_at > NOW()
    ORDER BY created_at DESC
  `, [businessId]);
  return result.rows.map(rowToStory);
}

/**
 * Get all active stories with business info
 */
export async function listActiveStoriesWithBusiness(): Promise<StoryWithBusiness[]> {
  const result = await query(`
    SELECT s.*, b.name_en, b.name_ar, b.media, b.username
    FROM stories s
    JOIN businesses b ON s.business_id = b.id
    WHERE s.expires_at > NOW() AND b.is_approved = true
    ORDER BY s.created_at DESC
  `);
  return result.rows.map(rowToStoryWithBusiness);
}

/**
 * Get businesses that have active stories, grouped by business
 */
export async function listBusinessesWithActiveStories(): Promise<BusinessWithStories[]> {
  const stories = await listActiveStoriesWithBusiness();
  
  const businessMap = new Map<string, BusinessWithStories>();
  
  for (const story of stories) {
    if (!businessMap.has(story.businessId)) {
      businessMap.set(story.businessId, {
        businessId: story.businessId,
        businessName: story.businessName,
        businessAvatar: story.businessAvatar,
        businessUsername: story.businessUsername,
        stories: [],
        hasUnviewed: true, // TODO: implement view tracking per user
      });
    }
    businessMap.get(story.businessId)!.stories.push({
      id: story.id,
      businessId: story.businessId,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      viewCount: story.viewCount,
    });
  }
  
  return Array.from(businessMap.values());
}

/**
 * Delete a story
 */
export async function deleteStory(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM stories WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Delete a story (only if it belongs to the business)
 */
export async function deleteStoryByBusiness(storyId: string, businessId: string): Promise<boolean> {
  const result = await query(`DELETE FROM stories WHERE id = $1 AND business_id = $2`, [storyId, businessId]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Increment view count for a story
 */
export async function incrementStoryViewCount(id: string): Promise<void> {
  await query(`UPDATE stories SET view_count = view_count + 1 WHERE id = $1`, [id]);
}

/**
 * Clean up expired stories (can be run periodically)
 */
export async function deleteExpiredStories(): Promise<number> {
  const result = await query(`DELETE FROM stories WHERE expires_at < NOW()`);
  return result.rowCount || 0;
}

/**
 * Get story count for a business (active stories only)
 */
export async function getActiveStoryCountByBusiness(businessId: string): Promise<number> {
  const result = await query(`
    SELECT COUNT(*) as count FROM stories 
    WHERE business_id = $1 AND expires_at > NOW()
  `, [businessId]);
  return parseInt(result.rows[0]?.count || "0", 10);
}
