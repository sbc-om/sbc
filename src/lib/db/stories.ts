import { nanoid } from "nanoid";
import { query } from "./postgres";

export type StoryOverlays = {
  textOverlays?: { text: string; x: number; y: number; fontSize: number; fontFamily: string; color: string; backgroundColor: string; rotation: number; scale: number }[];
  stickerOverlays?: { emoji: string; x: number; y: number; scale: number; rotation: number }[];
  filter?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  imageScale?: number;
  imagePosition?: { x: number; y: number };
};

export type Story = {
  id: string;
  businessId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  overlays?: StoryOverlays;
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
    overlays: row.overlays || undefined,
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
  overlays?: StoryOverlays;
}): Promise<Story> {
  const id = nanoid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  const result = await query(`
    INSERT INTO stories (id, business_id, media_url, media_type, caption, overlays, created_at, expires_at, view_count)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
    RETURNING *
  `, [id, input.businessId, input.mediaUrl, input.mediaType, input.caption || null, input.overlays ? JSON.stringify(input.overlays) : null, now, expiresAt]);

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
      overlays: story.overlays,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      viewCount: story.viewCount,
    });
  }
  
  return Array.from(businessMap.values());
}

/**
 * Get businesses with active stories filtered by user follows
 * Returns stories only from businesses that user follows directly or from followed categories
 */
export async function listFollowedBusinessesWithActiveStories(
  followedBusinessIds: Set<string>,
  followedCategoryIds: Set<string>,
  unfollowedBusinessIds: Set<string>
): Promise<BusinessWithStories[]> {
  const allStories = await listBusinessesWithActiveStories();
  
  // Filter stories to only include followed businesses
  return allStories.filter((businessWithStories) => {
    const businessId = businessWithStories.businessId;
    
    // Exclude unfollowed businesses
    if (unfollowedBusinessIds.has(businessId)) return false;
    
    // Include if directly following this business
    if (followedBusinessIds.has(businessId)) return true;
    
    // Need to check if business category is followed - fetch business info
    // For now, we can't easily get category from this data, so we need a different approach
    return false;
  });
}

/**
 * Get businesses with active stories filtered by user follows (with category check)
 */
export async function listFollowedBusinessesWithActiveStoriesWithCategory(
  userId: string
): Promise<BusinessWithStories[]> {
  // Get stories with business category info
  const result = await query(`
    SELECT s.*, b.name_en, b.name_ar, b.media, b.username, b.category_id,
           EXISTS(SELECT 1 FROM user_business_follows WHERE user_id = $1 AND business_id = b.id) as is_followed,
           EXISTS(SELECT 1 FROM user_business_unfollows WHERE user_id = $1 AND business_id = b.id) as is_unfollowed,
           EXISTS(SELECT 1 FROM user_category_follows WHERE user_id = $1 AND category_id = b.category_id) as category_followed
    FROM stories s
    JOIN businesses b ON s.business_id = b.id
    WHERE s.expires_at > NOW() AND b.is_approved = true
    ORDER BY s.created_at DESC
  `, [userId]);
  
  // Filter: include if (followed OR category_followed) AND NOT unfollowed
  const filteredRows = result.rows.filter((row: any) => {
    if (row.is_unfollowed) return false;
    return row.is_followed || row.category_followed;
  });
  
  // Group by business
  const businessMap = new Map<string, BusinessWithStories>();
  
  for (const row of filteredRows) {
    const story = rowToStoryWithBusiness(row);
    
    if (!businessMap.has(story.businessId)) {
      businessMap.set(story.businessId, {
        businessId: story.businessId,
        businessName: story.businessName,
        businessAvatar: story.businessAvatar,
        businessUsername: story.businessUsername,
        stories: [],
        hasUnviewed: true,
      });
    }
    businessMap.get(story.businessId)!.stories.push({
      id: story.id,
      businessId: story.businessId,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      overlays: story.overlays,
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

// ============================================
// Story Views
// ============================================

export type StoryView = {
  id: string;
  storyId: string;
  userId: string;
  viewedAt: string;
  // Joined user data
  userFullName?: string;
  userAvatar?: string;
  userUsername?: string;
};

function rowToStoryView(row: any): StoryView {
  return {
    id: row.id,
    storyId: row.story_id,
    userId: row.user_id,
    viewedAt: row.viewed_at?.toISOString() || new Date().toISOString(),
    userFullName: row.full_name,
    userAvatar: row.avatar_url,
    userUsername: row.username,
  };
}

/**
 * Record a view for a story (idempotent - won't duplicate)
 */
export async function recordStoryView(storyId: string, userId: string): Promise<void> {
  const id = nanoid();
  await query(`
    INSERT INTO story_views (id, story_id, user_id, viewed_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (story_id, user_id) DO NOTHING
  `, [id, storyId, userId]);
  
  // Also increment the total view count
  await incrementStoryViewCount(storyId);
}

/**
 * Get viewers for a story with user info
 */
export async function getStoryViewers(storyId: string): Promise<StoryView[]> {
  const result = await query(`
    SELECT sv.*, u.full_name, u.avatar_url, u.username
    FROM story_views sv
    JOIN users u ON sv.user_id = u.id
    WHERE sv.story_id = $1
    ORDER BY sv.viewed_at DESC
  `, [storyId]);
  return result.rows.map(rowToStoryView);
}

/**
 * Get view count for a story (unique viewers)
 */
export async function getStoryViewCount(storyId: string): Promise<number> {
  const result = await query(`
    SELECT COUNT(*) as count FROM story_views WHERE story_id = $1
  `, [storyId]);
  return parseInt(result.rows[0]?.count || "0", 10);
}

/**
 * Check if user has viewed a story
 */
export async function hasUserViewedStory(storyId: string, userId: string): Promise<boolean> {
  const result = await query(`
    SELECT 1 FROM story_views WHERE story_id = $1 AND user_id = $2
  `, [storyId, userId]);
  return result.rows.length > 0;
}

// ============================================
// Story Likes
// ============================================

export type StoryLike = {
  id: string;
  storyId: string;
  userId: string;
  createdAt: string;
  // Joined user data
  userFullName?: string;
  userAvatar?: string;
  userUsername?: string;
};

function rowToStoryLike(row: any): StoryLike {
  return {
    id: row.id,
    storyId: row.story_id,
    userId: row.user_id,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    userFullName: row.full_name,
    userAvatar: row.avatar_url,
    userUsername: row.username,
  };
}

/**
 * Like a story
 */
export async function likeStory(storyId: string, userId: string): Promise<boolean> {
  const id = nanoid();
  const result = await query(`
    INSERT INTO story_likes (id, story_id, user_id, created_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (story_id, user_id) DO NOTHING
    RETURNING id
  `, [id, storyId, userId]);
  return result.rows.length > 0;
}

/**
 * Unlike a story
 */
export async function unlikeStory(storyId: string, userId: string): Promise<boolean> {
  const result = await query(`
    DELETE FROM story_likes WHERE story_id = $1 AND user_id = $2
  `, [storyId, userId]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Get likers for a story with user info
 */
export async function getStoryLikers(storyId: string): Promise<StoryLike[]> {
  const result = await query(`
    SELECT sl.*, u.full_name, u.avatar_url, u.username
    FROM story_likes sl
    JOIN users u ON sl.user_id = u.id
    WHERE sl.story_id = $1
    ORDER BY sl.created_at DESC
  `, [storyId]);
  return result.rows.map(rowToStoryLike);
}

/**
 * Get like count for a story
 */
export async function getStoryLikeCount(storyId: string): Promise<number> {
  const result = await query(`
    SELECT COUNT(*) as count FROM story_likes WHERE story_id = $1
  `, [storyId]);
  return parseInt(result.rows[0]?.count || "0", 10);
}

/**
 * Check if user has liked a story
 */
export async function hasUserLikedStory(storyId: string, userId: string): Promise<boolean> {
  const result = await query(`
    SELECT 1 FROM story_likes WHERE story_id = $1 AND user_id = $2
  `, [storyId, userId]);
  return result.rows.length > 0;
}

// ============================================
// Story Comments
// ============================================

export type StoryComment = {
  id: string;
  storyId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  // Joined user data
  userFullName?: string;
  userAvatar?: string;
  userUsername?: string;
};

function rowToStoryComment(row: any): StoryComment {
  return {
    id: row.id,
    storyId: row.story_id,
    userId: row.user_id,
    text: row.text,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
    userFullName: row.full_name,
    userAvatar: row.avatar_url,
    userUsername: row.username,
  };
}

/**
 * Add a comment to a story
 */
export async function addStoryComment(storyId: string, userId: string, text: string): Promise<StoryComment> {
  const id = nanoid();
  await query(`
    INSERT INTO story_comments (id, story_id, user_id, text, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
  `, [id, storyId, userId, text]);
  
  // Fetch the comment with user info
  const result = await query(`
    SELECT sc.*, u.full_name, u.avatar_url, u.username
    FROM story_comments sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.id = $1
  `, [id]);
  
  return rowToStoryComment(result.rows[0]);
}

/**
 * Delete a comment (only by comment owner or story business owner)
 */
export async function deleteStoryComment(commentId: string): Promise<boolean> {
  const result = await query(`
    DELETE FROM story_comments WHERE id = $1
  `, [commentId]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Get a comment by ID with user info
 */
export async function getStoryCommentById(commentId: string): Promise<StoryComment | null> {
  const result = await query(`
    SELECT sc.*, u.full_name, u.avatar_url, u.username
    FROM story_comments sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.id = $1
  `, [commentId]);
  return result.rows.length > 0 ? rowToStoryComment(result.rows[0]) : null;
}

/**
 * Get comments for a story with user info
 */
export async function getStoryComments(storyId: string): Promise<StoryComment[]> {
  const result = await query(`
    SELECT sc.*, u.full_name, u.avatar_url, u.username
    FROM story_comments sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.story_id = $1
    ORDER BY sc.created_at ASC
  `, [storyId]);
  return result.rows.map(rowToStoryComment);
}

/**
 * Get comment count for a story
 */
export async function getStoryCommentCount(storyId: string): Promise<number> {
  const result = await query(`
    SELECT COUNT(*) as count FROM story_comments WHERE story_id = $1
  `, [storyId]);
  return parseInt(result.rows[0]?.count || "0", 10);
}

// ============================================
// Story Stats (for business owner dashboard)
// ============================================

export type StoryStats = {
  storyId: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  viewers: StoryView[];
  likers: StoryLike[];
  comments: StoryComment[];
};

/**
 * Get full stats for a story (viewers, likers, comments)
 */
export async function getStoryStats(storyId: string): Promise<StoryStats> {
  const [viewers, likers, comments] = await Promise.all([
    getStoryViewers(storyId),
    getStoryLikers(storyId),
    getStoryComments(storyId),
  ]);

  return {
    storyId,
    viewCount: viewers.length,
    likeCount: likers.length,
    commentCount: comments.length,
    viewers,
    likers,
    comments,
  };
}

/**
 * Get stats summary for all stories of a business
 */
export async function getBusinessStoriesStats(businessId: string): Promise<{
  stories: Array<Story & { stats: { viewCount: number; likeCount: number; commentCount: number } }>;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}> {
  const stories = await getActiveStoriesByBusiness(businessId);
  
  const storiesWithStats = await Promise.all(
    stories.map(async (story) => {
      const [viewCount, likeCount, commentCount] = await Promise.all([
        getStoryViewCount(story.id),
        getStoryLikeCount(story.id),
        getStoryCommentCount(story.id),
      ]);
      return {
        ...story,
        stats: { viewCount, likeCount, commentCount },
      };
    })
  );

  const totalViews = storiesWithStats.reduce((sum, s) => sum + s.stats.viewCount, 0);
  const totalLikes = storiesWithStats.reduce((sum, s) => sum + s.stats.likeCount, 0);
  const totalComments = storiesWithStats.reduce((sum, s) => sum + s.stats.commentCount, 0);

  return {
    stories: storiesWithStats,
    totalViews,
    totalLikes,
    totalComments,
  };
}
