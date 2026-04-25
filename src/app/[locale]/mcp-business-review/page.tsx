import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineCodeBracket,
  HiOutlineCommandLine,
  HiOutlineCpuChip,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineServerStack,
  HiOutlineSparkles,
  HiOutlineUsers,
} from "react-icons/hi2";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { isLocale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function McpBusinessReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const ar = locale === "ar";

  const audience = [
    ar ? "أصحاب الأعمال الذين يريدون فهم جودة ظهور نشاطهم" : "Business owners who want to understand profile quality and visibility",
    ar ? "فرق التسويق التي تريد مراجعة جاهزية الملف التجاري" : "Marketing teams reviewing directory and discovery readiness",
    ar ? "المطورون الذين يستخدمون Claude أو Cursor أو أي عميل MCP" : "Developers using Claude, Cursor, or any MCP-compatible client",
    ar ? "الفرق الداخلية التي تريد فحص بيانات الأنشطة بشكل منظّم" : "Internal teams that need structured business audits",
  ];

  const tools = [
    {
      name: "list_member_businesses",
      description: ar
        ? "يعرض قائمة الأنشطة التجارية مع فلترة بالحالة أو البحث"
        : "Lists businesses with approval and search filters",
    },
    {
      name: "get_member_business",
      description: ar
        ? "يجلب بيانات نشاط واحد باستخدام المعرف أو الرابط المختصر"
        : "Fetches one business by id or slug",
    },
    {
      name: "review_member_businesses",
      description: ar
        ? "ينفذ مراجعة heuristic مع تحليل AI اختياري لمجموعة أنشطة"
        : "Runs heuristic review with optional AI analysis for selected businesses",
    },
  ];

  const steps = [
    {
      title: ar ? "1. افتح عميل يدعم MCP" : "1. Open an MCP-compatible client",
      body: ar
        ? "استخدم Claude Desktop أو Cursor أو أي أداة تدعم Model Context Protocol."
        : "Use Claude Desktop, Cursor, or any client that supports the Model Context Protocol.",
    },
    {
      title: ar ? "2. اربط هذا المشروع كسيرفر MCP" : "2. Register this project as an MCP server",
      body: ar
        ? "أضف أمر التشغيل `pnpm mcp:business-review` داخل إعدادات MCP في العميل."
        : "Add the `pnpm mcp:business-review` command to the client MCP configuration.",
    },
    {
      title: ar ? "3. اطلب من AI مراجعة الأنشطة" : "3. Ask AI to review businesses",
      body: ar
        ? "مثلاً: راجع أفضل 5 أنشطة غير مكتملة أو اعرض لي الأنشطة التي تحتاج تحسين بيانات الاتصال."
        : "For example: review the top 5 incomplete profiles or show businesses missing contact data.",
    },
    {
      title: ar ? "4. استلم تقريراً عملياً" : "4. Receive an actionable report",
      body: ar
        ? "ستحصل على نقاط قوة ومخاطر وتوصيات ومجالات النقص لكل نشاط."
        : "You get strengths, risks, recommendations, and missing fields for each business.",
    },
  ];

  const examplePrompts = [
    ar ? "اعرض آخر 10 أنشطة معتمدة في المنصة." : "List the latest 10 approved businesses in the platform.",
    ar ? "راجع الأنشطة التي ينقصها رقم هاتف أو موقع إلكتروني." : "Review businesses that are missing a phone number or website.",
    ar ? "حلل هذه الأنشطة واقترح أولويات التحسين في الظهور والثقة." : "Analyze these businesses and suggest visibility and trust priorities.",
  ];

  const requirements = [
    ar ? "الوصول إلى هذا المشروع أو النسخة المستضافة منه" : "Access to this project or a hosted copy of it",
    ar ? "قاعدة بيانات SBC متصلة وتعمل" : "A working SBC database connection",
    ar ? "عميل يدعم MCP" : "An MCP-compatible client",
    ar ? "اختياري: مفتاح OPENAI_API_KEY لتفعيل التحليل المتقدم" : "Optional: an OPENAI_API_KEY for advanced AI review",
  ];

  const configSnippet = `{
  "mcpServers": {
    "sbc-business-review": {
      "command": "pnpm",
      "args": ["mcp:business-review"],
      "cwd": "/absolute/path/to/sbc"
    }
  }
}`;

  const commandSnippet = `pnpm install
pnpm mcp:business-review`;

  return (
    <PublicPage>
      <section>
        <div className="max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-(--surface-border) bg-(--surface) px-3 py-1 text-sm font-semibold text-(--muted-foreground)">
            <HiOutlineServerStack className="h-4 w-4" />
            {ar ? "متاح للعامة" : "Publicly Available"}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {ar ? "MCP لمراجعة الأنشطة التجارية" : "MCP for Business Review"}
          </h1>
          <p className="mt-4 text-xl font-medium text-(--muted-foreground)">
            {ar
              ? "واجهة عامة تمكّن أي شخص من ربط SBC مع عميل AI لمراجعة الأنشطة التجارية الأعضاء وتحليل جاهزيتها."
              : "A public-facing MCP that lets anyone connect SBC to an AI client and review member businesses with structured analysis."}
          </p>
          <p className="mt-6 text-lg leading-8 font-medium text-(--muted-foreground)">
            {ar
              ? "هذا السيرفر يقرأ بيانات الأنشطة من قاعدة بيانات SBC ويعيدها على شكل أدوات قابلة للاستخدام داخل عملاء MCP مثل Claude وCursor. كما يقدّم مراجعة آلية لنواقص الملف التجاري، مع تحليل AI اختياري عند تفعيل مفتاح النموذج."
              : "This server reads business data from SBC and exposes it as tools inside MCP clients such as Claude and Cursor. It also returns automated profile-gap reviews, with optional AI analysis when a model key is configured."}
          </p>
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="sbc-card rounded-3xl p-7 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            {ar ? "ماذا يفعل؟" : "What it does"}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <HiOutlineMagnifyingGlass className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-lg font-semibold">{ar ? "استكشاف البيانات" : "Data exploration"}</h3>
              <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
                {ar
                  ? "استعرض الأنشطة، وابحث فيها، واجلب تفاصيل أي نشاط مباشرة من داخل عميل AI."
                  : "Browse, search, and fetch any business profile directly from an AI client."}
              </p>
            </div>
            <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <HiOutlineSparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-lg font-semibold">{ar ? "مراجعة الجودة" : "Quality review"}</h3>
              <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
                {ar
                  ? "يعطيك نقاط قوة ومخاطر ونواقص وتوصيات عملية لتحسين الملف التجاري."
                  : "Returns strengths, risks, missing fields, and practical profile recommendations."}
              </p>
            </div>
          </div>
        </div>

        <div className="sbc-card rounded-3xl p-7 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            {ar ? "مناسب لمن؟" : "Who it is for"}
          </h2>
          <ul className="mt-5 grid gap-3 text-base font-medium text-(--muted-foreground)">
            {audience.map((item) => (
              <li key={item} className="inline-flex items-start gap-2">
                <HiOutlineUsers className="mt-1 h-5 w-5 shrink-0 text-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">
          {ar ? "الأدوات المتاحة" : "Available tools"}
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {tools.map((tool) => (
            <div key={tool.name} className="sbc-card rounded-2xl p-5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <HiOutlineCpuChip className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-lg font-semibold">{tool.name}</h3>
              <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">{tool.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">
          {ar ? "طريقة الاستخدام" : "How to use it"}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="sbc-card sbc-card--interactive rounded-2xl p-5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-(--accent-foreground) text-sm font-bold">
                {index + 1}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        <div className="sbc-card rounded-3xl p-7 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <HiOutlineCommandLine className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {ar ? "أوامر التشغيل" : "Run commands"}
            </h2>
          </div>
          <pre className="mt-5 overflow-x-auto rounded-2xl border border-(--surface-border) bg-slate-950 p-5 text-sm leading-7 text-slate-100">
            <code>{commandSnippet}</code>
          </pre>
          <p className="mt-4 text-sm leading-7 text-(--muted-foreground)">
            {ar
              ? "بعد تشغيل السيرفر، سيبقى بانتظار عميل MCP عبر stdio."
              : "After startup, the server waits for an MCP client over stdio."}
          </p>
        </div>

        <div className="sbc-card rounded-3xl p-7 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <HiOutlineCodeBracket className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {ar ? "إعداد عميل MCP" : "MCP client config"}
            </h2>
          </div>
          <pre className="mt-5 overflow-x-auto rounded-2xl border border-(--surface-border) bg-slate-950 p-5 text-sm leading-7 text-slate-100">
            <code>{configSnippet}</code>
          </pre>
          <p className="mt-4 text-sm leading-7 text-(--muted-foreground)">
            {ar
              ? "استبدل المسار بالقيمة الفعلية للمشروع على جهازك أو على السيرفر المستضيف."
              : "Replace the working directory with the real project path on your machine or hosted environment."}
          </p>
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="sbc-card rounded-3xl p-7 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
              <HiOutlineCheckCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {ar ? "المتطلبات" : "Requirements"}
            </h2>
          </div>
          <ul className="mt-5 grid gap-3 text-base font-medium text-(--muted-foreground)">
            {requirements.map((item) => (
              <li key={item} className="inline-flex items-start gap-2">
                <HiOutlineCheckCircle className="mt-1 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="sbc-card rounded-3xl p-7 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <HiOutlineDocumentText className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {ar ? "أمثلة على الطلبات" : "Example prompts"}
            </h2>
          </div>
          <div className="mt-5 grid gap-3">
            {examplePrompts.map((prompt) => (
              <div key={prompt} className="rounded-2xl border border-(--surface-border) bg-(--surface) px-4 py-3 text-sm font-medium text-(--muted-foreground)">
                {prompt}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 mb-10">
        <div className="sbc-card rounded-3xl p-7 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                {ar ? "ابدأ الآن" : "Start now"}
              </h2>
              <p className="mt-3 text-lg font-medium leading-8 text-(--muted-foreground)">
                {ar
                  ? "إذا كنت تريد استخدام MCP لتحليل الأنشطة التجارية أو عرضها لعُملائك، ابدأ بربطه في عميل AI أو اطلب إضافة نشاطك إلى المنصة."
                  : "If you want to use this MCP to analyze business profiles or expose them through AI workflows, connect it in your client or register your business on the platform."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/business-request`}
                className={buttonVariants({ variant: "primary", size: "lg", className: "min-w-[220px]" })}
              >
                {ar ? "سجل نشاطك" : "Register your business"}
                <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
              </Link>
              <Link
                href={`/${locale}/contact`}
                className={buttonVariants({ variant: "secondary", size: "lg", className: "min-w-[220px]" })}
              >
                {ar ? "تواصل معنا" : "Contact us"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}