"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type FollowStatus = "following" | "unfollowed" | "neutral" | "guest";

interface FollowBusinessButtonProps {
  businessId: string;
  locale: "en" | "ar";
  className?: string;
  /**
   * Compact mode for toolbar buttons (icon only)
   */
  compact?: boolean;
  /**
   * Optional initial follow status to avoid loading flash
   */
  initialStatus?: FollowStatus;
  /**
   * Whether user follows this business's category
   */
  initialFollowsCategory?: boolean;
}

export function FollowBusinessButton({
  businessId,
  locale,
  className = "",
  compact = false,
  initialStatus,
  initialFollowsCategory,
}: FollowBusinessButtonProps) {
  const router = useRouter();
  const ar = locale === "ar";
  const [status, setStatus] = useState<FollowStatus>(initialStatus ?? "neutral");
  const [followsCategory, setFollowsCategory] = useState(initialFollowsCategory ?? false);
  const [loading, setLoading] = useState(!initialStatus);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (initialStatus) return;

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/businesses/${businessId}/follow`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setStatus(data.status === "guest" ? "guest" : data.status);
          setFollowsCategory(data.followsCategory ?? false);
        }
      } catch (error) {
        console.error("Failed to fetch follow status:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [businessId, initialStatus]);

  const handleClick = async () => {
    if (status === "guest") {
      // Get the current URL info to build proper redirect
      const currentHostname = window.location.hostname;
      
      // Check if we're on a subdomain (e.g., spirithub.sbc.om or spirithub.localhost)
      const baseDomains = ["sbc.om", "localhost"];
      let isSubdomain = false;
      let subdomain = "";
      
      for (const baseDomain of baseDomains) {
        if (currentHostname.endsWith(`.${baseDomain}`) && !currentHostname.startsWith("www.")) {
          isSubdomain = true;
          subdomain = currentHostname.slice(0, -(baseDomain.length + 1));
          break;
        }
      }
      
      if (isSubdomain && subdomain) {
        // Redirect to main domain with subdomain as redirect target
        const port = window.location.port ? `:${window.location.port}` : "";
        const protocol = window.location.protocol;
        const mainDomain = currentHostname.replace(`${subdomain}.`, "");
        const redirectTarget = `/@${subdomain}`;
        const loginUrl = `${protocol}//${mainDomain}${port}/${locale}/login?redirect=${encodeURIComponent(redirectTarget)}`;
        window.location.href = loginUrl;
      } else {
        // Normal redirect within same domain
        router.push(`/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      }
      return;
    }

    setUpdating(true);
    try {
      let method: string;

      if (status === "following") {
        // User is following, wants to unfollow
        method = "DELETE";
      } else if (status === "unfollowed") {
        // User has unfollowed, wants to re-follow (remove from blocklist)
        if (followsCategory) {
          // If they follow the category, just remove from unfollows
          method = "PATCH";
        } else {
          // If they don't follow the category, add to follows
          method = "POST";
        }
      } else {
        // Neutral: user hasn't interacted
        if (followsCategory) {
          // If they follow category, clicking means unfollow this specific business
          method = "DELETE";
        } else {
          // If they don't follow category, clicking means follow this business
          method = "POST";
        }
      }

      const res = await fetch(`/api/businesses/${businessId}/follow`, {
        method,
        credentials: "include",
      });

      const data = await res.json();
      if (data.ok) {
        setStatus(data.status);
      } else {
        // Revert on error
        console.error("Follow action failed:", data.error);
      }
    } catch (error) {
      console.error("Failed to update follow status:", error);
    } finally {
      setUpdating(false);
    }
  };

  // Determine visual state
  const isFollowing = status === "following" || (status === "neutral" && followsCategory);
  const isHidden = status === "unfollowed";

  // Get button text and icon based on state
  const getText = () => {
    if (loading) return ar ? "..." : "...";
    if (isHidden) {
      return ar ? "مخفي" : "Hidden";
    }
    if (isFollowing) {
      return ar ? "متابَع" : "Following";
    }
    return ar ? "متابعة" : "Follow";
  };

  const getIcon = () => {
    if (loading) {
      return (
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      );
    }
    if (isHidden) {
      // Eye-off icon for hidden
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      );
    }
    if (isFollowing) {
      // Check icon for following
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    // Plus icon for follow
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    );
  };

  const getTitle = () => {
    if (isHidden) return ar ? "إظهار هذا النشاط التجاري" : "Show this business";
    if (isFollowing) return ar ? "إلغاء المتابعة" : "Unfollow";
    return ar ? "متابعة" : "Follow";
  };

  // Button styles based on state
  const getButtonStyles = () => {
    const base = "transition-all duration-200 flex items-center justify-center gap-2";
    
    if (compact) {
      // Toolbar style (icon only, circular)
      if (isHidden) {
        return `${base} h-10 w-10 p-0 rounded-full bg-red-500/30 text-red-200 hover:bg-red-500/40 border border-red-400/30 backdrop-blur`;
      }
      if (isFollowing) {
        return `${base} h-10 w-10 p-0 rounded-full bg-green-500/30 text-green-200 hover:bg-green-500/40 border border-green-400/30 backdrop-blur`;
      }
      return `${base} h-10 w-10 p-0 rounded-full bg-black/40 text-white hover:bg-black/55 border border-white/20 backdrop-blur`;
    }

    // Full button style
    if (isHidden) {
      return `${base} px-4 py-2 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 border border-red-300 dark:border-red-700`;
    }
    if (isFollowing) {
      return `${base} px-4 py-2 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 border border-green-300 dark:border-green-700`;
    }
    return `${base} px-4 py-2 rounded-full bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || updating}
      title={getTitle()}
      aria-label={getTitle()}
      className={`${getButtonStyles()} ${updating ? "opacity-70" : ""} ${className}`}
    >
      {getIcon()}
      {!compact && <span className="text-sm font-medium">{getText()}</span>}
    </button>
  );
}
