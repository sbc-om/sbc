export default function LoyaltyStaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-transparent text-foreground flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
