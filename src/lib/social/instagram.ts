export type InstagramPostPreview = {
  id: string;
  shortcode: string;
  permalink: string;
  thumbnailUrl?: string;
  caption?: string;
  takenAt?: string;
};

function pickBestInstagramImageUrl(node: any): string | undefined {
  const candidates: Array<{ url?: string; width?: number; height?: number }> = [];

  if (Array.isArray(node?.display_resources)) {
    candidates.push(...node.display_resources);
  }

  if (Array.isArray(node?.thumbnail_resources)) {
    candidates.push(...node.thumbnail_resources);
  }

  if (Array.isArray(node?.image_versions2?.candidates)) {
    candidates.push(...node.image_versions2.candidates);
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
    (typeof node?.display_url === "string" ? node.display_url : undefined) ||
    (typeof node?.thumbnail_src === "string" ? node.thumbnail_src : undefined)
  );
}

function normalizeInstagramUsername(input: string): string {
  return input.trim().replace(/^@/, "").toLowerCase();
}

function mapEdgesToPosts(edges: Array<any>, limit: number): InstagramPostPreview[] {
  return edges
    .slice(0, limit)
    .map((edge: any) => {
      const node = edge?.node || {};
      const shortcode = String(node.shortcode || "").trim();
      if (!shortcode) return null;

      const captionEdge = node?.edge_media_to_caption?.edges?.[0]?.node?.text;

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

async function fetchProfileInfo(username: string): Promise<any | null> {
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

async function fetchLegacyProfile(username: string): Promise<any | null> {
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

function mapGraphqlMediaToPosts(graphqlMedia: Array<any>, limit: number): InstagramPostPreview[] {
  return graphqlMedia
    .slice(0, limit)
    .map((entry: any) => {
      const node = entry?.shortcode_media || entry?.node || {};
      const shortcode = String(node.shortcode || "").trim();
      if (!shortcode) return null;

      const captionEdge = node?.edge_media_to_caption?.edges?.[0]?.node?.text;

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
        const parsed = JSON.parse(unescaped) as { context?: { graphql_media?: Array<any> } };
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
  const edgesFromApi = profileInfo?.data?.user?.edge_owner_to_timeline_media?.edges;
  if (Array.isArray(edgesFromApi) && edgesFromApi.length > 0) {
    return mapEdgesToPosts(edgesFromApi, boundedLimit);
  }

  const legacy = await fetchLegacyProfile(username);
  const edgesFromLegacy =
    legacy?.graphql?.user?.edge_owner_to_timeline_media?.edges ||
    legacy?.data?.user?.edge_owner_to_timeline_media?.edges;

  if (Array.isArray(edgesFromLegacy) && edgesFromLegacy.length > 0) {
    return mapEdgesToPosts(edgesFromLegacy, boundedLimit);
  }

  const embedPosts = await fetchEmbedProfile(username);
  if (embedPosts.length > 0) {
    return embedPosts.slice(0, boundedLimit);
  }

  return [];
}
