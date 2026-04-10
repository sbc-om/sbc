import { Container } from "@/components/Container";
import { BusinessCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

function SectionSkeleton({
  titleWidth,
  count,
}: {
  titleWidth: string;
  count: number;
}) {
  return (
    <section className="py-16">
      <Container size="lg">
        <div className="mb-10">
          <Skeleton width={titleWidth} height={36} rounded="lg" />
          <Skeleton className="mt-3" width="280px" height={18} rounded="md" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }, (_, index) => (
            <BusinessCardSkeleton key={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export function HomepageBusinessSectionsSkeleton() {
  return (
    <>
      <SectionSkeleton titleWidth="220px" count={3} />
      <SectionSkeleton titleWidth="180px" count={6} />
      <SectionSkeleton titleWidth="200px" count={6} />
    </>
  );
}
