export type InstagramPostPreview = {
  id: string;
  shortcode: string;
  permalink: string;
  thumbnailUrl?: string;
  caption?: string;
  takenAt?: string;
};

type GenericObject = Record<string, unknown>;

function asObject(value: unknown): GenericObject {
  return typeof value === "object" && value !== null ? (value as GenericObject) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pickBestInstagramImageUrl(nodeInput: unknown): string | undefined {
  const node = asObject(nodeInput);
  const candidates: Array<{ url?: string; width?: number; height?: number }> = [];

  const displayResources = asArray(node.display_resources);
  if (displayResources.length > 0) {
    candidates.push(...displayResources.map((entry) => asObject(entry)));
  }

  const thumbnailResources = asArray(node.thumbnail_resources);
  if (thumbnailResources.length > 0) {
    candidates.push(...thumbnailResources.map((entry) => asObject(entry)));
  }

  const imageVersions2 = asObject(node.image_versions2);
  const versionCandidates = asArray(imageVersions2.candidates);
  if (versionCandidates.length > 0) {
    candidates.push(...versionCandidates.map((entry) => asObject(entry)));
  }

  const best = candidates
    .filter((entry) => typeof entry?.url === "string" && entry.url.trim().length > 0)
    .sort((left, right) => {
      const leftScore = Number(left?.width || 0) * Number(left?.height || 0);
      const rightScore = Number(right?.width || 0) * Number(right?.height || 0);
      return rightScore - leftScore;
    })[0];

  return (
    best?.url?.trim() ||
    (typeof node.display_url === "string" ? node.display_url : undefined) ||
    (typeof node.thumbnail_src === "string" ? node.thumbnail_src : undefined)
  );
}

function normalizeInstagramUsername(input: string): string {
  return input.trim().replace(/^@/, "").toLowerCase();
}

function mapEdgesToPosts(edgesInput: unknown[], limit: number): InstagramPostPreview[] {
  const edges = edgesInput.map((edge) => asObject(edge));
  return edges
    .slice(0, limit)
    .map((edge) => {
      const node = asObject(edge.node);
      const shortcode = String(node.shortcode || "").trim();
      if (!shortcode) return null;

      const captionContainer = asObject(node.edge_media_to_caption);
      const captionEdges = asArray(captionContainer.edges);
      const firstCaptionEdge = asObject(captionEdges[0]);
      const captionNode = asObject(firstCaptionEdge.node);
      const captionEdge = captionNode.text;

      return {
        id: String(node.id || shortcode),
        shortcode,
        permalink: `https://www.instagram.com/p/${shortcode}/`,
        thumbnailUrl: pickBestInstagramImageUrl(node),
        caption: typeof captionEdge === "string" ? captionEdge : undefined,
        takenAt: node.taken_at_timestamp
          ? new Date(Number(node.taken_at_timestamp) * 1000).toISOString()
          : undefined,
      } as InstagramPostPreview;
    })
    .filter((item): item is InstagramPostPreview => !!item);
}

async function fetchProfileInfo(username: string): Promise<unknown | null> {
  const urls = [
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
  ];

  try {
    for (const url of urls) {
      const res = await fetch(url, {
        headers: {
          "x-ig-app-id": "936619743392459",
          "user-agent": "Mozilla/5.0",
          accept: "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) continue;

      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchLegacyProfile(username: string): Promise<unknown | null> {
  try {
    const url = `https://www.instagram.com/${encodeURIComponent(username)}/?__a=1&__d=dis`;
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0",
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function mapGraphqlMediaToPosts(graphqlMediaInput: unknown[], limit: number): InstagramPostPreview[] {
  const graphqlMedia = graphqlMediaInput.map((entry) => asObject(entry));
  return graphqlMedia
    .slice(0, limit)
    .map((entry) => {
      const shortcodeMedia = asObject(entry.shortcode_media);
      const entryNode = asObject(entry.node);
      const node = Object.keys(shortcodeMedia).length > 0 ? shortcodeMedia : entryNode;
      const shortcode = String(node.shortcode || "").trim();
      if (!shortcode) return null;

      const captionContainer = asObject(node.edge_media_to_caption);
      const captionEdges = asArray(captionContainer.edges);
      const firstCaptionEdge = asObject(captionEdges[0]);
      const captionNode = asObject(firstCaptionEdge.node);
      const captionEdge = captionNode.text;

      return {
        id: String(node.id || shortcode),
        shortcode,
        permalink: `https://www.instagram.com/p/${shortcode}/`,
        thumbnailUrl: pickBestInstagramImageUrl(node),
        caption: typeof captionEdge === "string" ? captionEdge : undefined,
        takenAt: node.taken_at_timestamp
          ? new Date(Number(node.taken_at_timestamp) * 1000).toISOString()
          : undefined,
      } as InstagramPostPreview;
    })
    .filter((item): item is InstagramPostPreview => !!item);
}

function extractEscapedJsonString(source: string, marker: string): string | null {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return null;

  const start = markerIndex + marker.length;
  let escaped = "";
  let escapedMode = false;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];

    if (escapedMode) {
      escaped += `\\${ch}`;
      escapedMode = false;
      continue;
    }

    if (ch === "\\") {
      escapedMode = true;
      continue;
    }

    if (ch === '"') {
      return escaped;
    }

    escaped += ch;
  }

  return null;
}

function mapShortcodesToPosts(shortcodes: string[], limit: number): InstagramPostPreview[] {
  return shortcodes.slice(0, limit).map((shortcode) => ({
    id: shortcode,
    shortcode,
    permalink: `https://www.instagram.com/p/${shortcode}/`,
  }));
}

async function fetchEmbedProfile(username: string): Promise<InstagramPostPreview[]> {
  try {
    const url = `https://www.instagram.com/${encodeURIComponent(username)}/embed`;
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0",
        accept: "text/html",
      },
      cache: "no-store",
    });

    if (!res.ok) return [];
    const html = await res.text();

    const escapedContext = extractEscapedJsonString(html, '"contextJSON":"');
    if (escapedContext) {
      try {
        const unescaped = JSON.parse(`"${escapedContext}"`) as string;
        const parsed = JSON.parse(unescaped) as { context?: { graphql_media?: unknown[] } };
        const graphqlMedia = parsed?.context?.graphql_media;

        if (Array.isArray(graphqlMedia) && graphqlMedia.length > 0) {
          return mapGraphqlMediaToPosts(graphqlMedia, 12);
        }
      } catch {
      }
    }

    const shortcodeMatches = [...html.matchAll(/\\"shortcode\\":\\"([A-Za-z0-9_-]{5,})\\"/g)].map((m) => m[1]);
    const uniqueShortcodes = Array.from(new Set(shortcodeMatches));
    if (uniqueShortcodes.length > 0) {
      return mapShortcodesToPosts(uniqueShortcodes, 12);
    }

    return [];
  } catch {
    return [];
  }
}

export async function getInstagramPostsPreview(
  usernameInput: string,
  limit = 6
): Promise<InstagramPostPreview[]> {
  const username = normalizeInstagramUsername(usernameInput);
  if (!username) return [];
  const boundedLimit = Math.max(1, Math.min(limit, 12));

  const profileInfo = await fetchProfileInfo(username);
  const profileInfoObj = asObject(profileInfo);
  const profileInfoData = asObject(profileInfoObj.data);
  const profileInfoUser = asObject(profileInfoData.user);
  const profileInfoTimeline = asObject(profileInfoUser.edge_owner_to_timeline_media);
  const edgesFromApi = profileInfoTimeline.edges;
  if (Array.isArray(edgesFromApi) && edgesFromApi.length > 0) {
    return mapEdgesToPosts(edgesFromApi, boundedLimit);
  }

  const legacy = await fetchLegacyProfile(username);
  const legacyObj = asObject(legacy);
  const legacyGraphql = asObject(legacyObj.graphql);
  const legacyGraphqlUser = asObject(legacyGraphql.user);
  const legacyGraphqlTimeline = asObject(legacyGraphqlUser.edge_owner_to_timeline_media);
  const legacyData = asObject(legacyObj.data);
  const legacyDataUser = asObject(legacyData.user);
  const legacyDataTimeline = asObject(legacyDataUser.edge_owner_to_timeline_media);
  const edgesFromLegacy =
    legacyGraphqlTimeline.edges ||
    legacyDataTimeline.edges;

  if (Array.isArray(edgesFromLegacy) && edgesFromLegacy.length > 0) {
    return mapEdgesToPosts(edgesFromLegacy, boundedLimit);
  }

  const embedPosts = await fetchEmbedProfile(username);
  if (embedPosts.length > 0) {
    return embedPosts.slice(0, boundedLimit);
  }

  return [];
}
