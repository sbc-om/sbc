import { AppPage } from "@/components/AppPage";
import { BusinessDetailSkeleton } from "@/components/business/BusinessDetailSkeleton";

export default function Loading() {
  return (
    <AppPage>
      <BusinessDetailSkeleton showComposer showRecommendations />
    </AppPage>
  );
}
