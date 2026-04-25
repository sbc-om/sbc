import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SBC MCP Business Review";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === "ar";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at top right, rgba(56, 189, 248, 0.25), transparent 28%), linear-gradient(135deg, #eff6ff 0%, #f8fafc 40%, #eef2ff 100%)",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: 9999,
            background: "rgba(59, 130, 246, 0.18)",
            filter: "blur(20px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -50,
            width: 300,
            height: 300,
            borderRadius: 9999,
            background: "rgba(16, 185, 129, 0.14)",
            filter: "blur(18px)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "56px 64px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 9999,
                  background: "rgba(59, 130, 246, 0.12)",
                  color: "#2563eb",
                  padding: "8px 16px",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                MCP
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 9999,
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  padding: "8px 16px",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                AI
              </div>
            </div>

            <div
              style={{
                display: "flex",
                maxWidth: 850,
                fontSize: 64,
                lineHeight: 1.05,
                fontWeight: 800,
                letterSpacing: "-0.04em",
              }}
            >
              {ar ? "مراجعة الأعمال عبر MCP" : "Business Review via MCP"}
            </div>

            <div
              style={{
                display: "flex",
                maxWidth: 860,
                color: "#334155",
                fontSize: 30,
                lineHeight: 1.35,
                fontWeight: 500,
              }}
            >
              {ar
                ? "اربط SBC مع عملاء الذكاء الاصطناعي لتحليل ملفات الأنشطة التجارية ومراجعة جاهزيتها بشكل منظم."
                : "Connect SBC to AI clients to analyze member business profiles and audit readiness in a structured workflow."}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>
                Smart Business Center
              </div>
              <div style={{ fontSize: 22, color: "#475569" }}>
                {ar ? "بحث، تقييم، وتوصيات قابلة للتنفيذ" : "Search, evaluation, and actionable recommendations"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 28,
                background: "#0f172a",
                color: "white",
                padding: "18px 26px",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              /mcp-business-review
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}