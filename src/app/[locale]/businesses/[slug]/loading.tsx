import { PublicPage } from "@/components/PublicPage";
import { BusinessDetailSkeleton } from "@/components/business/BusinessDetailSkeleton";

export default function Loading() {
  return (
    <PublicPage>
      <BusinessDetailSkeleton showComposer={false} showRecommendations />
    </PublicPage>
  );
}
