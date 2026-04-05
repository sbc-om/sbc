export default function AdminAgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_42%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_38%)]">
      {children}
    </div>
  );
}

