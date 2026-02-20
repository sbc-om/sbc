type BusinessDetailSkeletonProps = {
  showComposer?: boolean;
  showRecommendations?: boolean;
};

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-(--surface-border) ${className}`} />;
}

export function BusinessDetailSkeleton({
  showComposer = false,
  showRecommendations = true,
}: BusinessDetailSkeletonProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0" />
        <SkeletonBlock className="h-8 w-28 rounded-full" />
      </div>

      <section className="sbc-card rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <SkeletonBlock className="h-7 w-48 sm:h-8 sm:w-64" />
            <SkeletonBlock className="h-4 w-32" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-7 w-20 rounded-full" />
              <SkeletonBlock className="h-7 w-24 rounded-full" />
              <SkeletonBlock className="h-7 w-28 rounded-full" />
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-56">
            <SkeletonBlock className="h-10 rounded-xl" />
            <SkeletonBlock className="h-10 rounded-xl" />
          </div>
        </div>
      </section>

      <section className="sbc-card rounded-2xl p-4 sm:p-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <article key={`news-skeleton-${idx}`} className="overflow-hidden rounded-3xl border border-(--surface-border) bg-(--chip-bg)">
              <SkeletonBlock className="h-40 w-full rounded-none sm:h-44" />
              <div className="space-y-3 p-4 sm:p-5">
                <SkeletonBlock className="h-5 w-3/4" />
                <div className="flex gap-2">
                  <SkeletonBlock className="h-6 w-20 rounded-full" />
                  <SkeletonBlock className="h-6 w-16 rounded-full" />
                </div>
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-5/6" />
                <SkeletonBlock className="h-4 w-3/4" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sbc-card rounded-2xl p-4 sm:p-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <article key={`product-skeleton-${idx}`} className="overflow-hidden rounded-3xl border border-(--surface-border) bg-(--chip-bg)">
              <SkeletonBlock className="h-40 w-full rounded-none sm:h-44" />
              <div className="space-y-3 p-4 sm:p-5">
                <SkeletonBlock className="h-5 w-2/3" />
                <SkeletonBlock className="h-6 w-24 rounded-full" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-4/5" />
                <SkeletonBlock className="h-5 w-28" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {showComposer ? (
        <section className="sbc-card rounded-2xl p-4 sm:p-6">
          <div className="space-y-3">
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-32 w-full rounded-2xl" />
            <SkeletonBlock className="h-10 w-36 rounded-xl" />
          </div>
        </section>
      ) : null}

      {showRecommendations ? (
        <section className="sbc-card rounded-2xl p-4 sm:p-6">
          <SkeletonBlock className="h-6 w-48" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <SkeletonBlock key={`rec-skeleton-${idx}`} className="h-36 w-full rounded-2xl" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
