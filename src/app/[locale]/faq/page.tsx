import { notFound } from "next/navigation";
import Link from "next/link";

import { PublicPage } from "@/components/PublicPage";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { buttonVariants } from "@/components/ui/Button";
import { FadeInSection } from "@/components/FadeInSection";

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);

  const faqs = locale === "ar" ? [
    {
      category: "عام",
      questions: [
        {
          q: "ما هو Smart Business Center؟",
          a: "Smart Business Center هو منصة متكاملة توفر ثلاثة حلول رئيسية: دليل الأعمال، بطاقات الولاء الرقمية، ومنصة التسويق عبر واتساب وتلغرام. نساعد الشركات على النمو والوصول إلى عملاء جدد."
        },
        {
          q: "هل التسجيل مجاني؟",
          a: "نعم، التسجيل الأساسي مجاني تماماً. يمكنك إنشاء حساب وإضافة عملك بدون أي تكلفة. نوفر أيضاً خطط مدفوعة للميزات المتقدمة."
        },
        {
          q: "ما هي اللغات المدعومة؟",
          a: "المنصة تدعم اللغتين العربية والإنجليزية بشكل كامل مع واجهة متكيفة تلقائياً مع اتجاه النص (RTL/LTR)."
        },
      ]
    },
    {
      category: "دليل الأعمال",
      questions: [
        {
          q: "كيف يمكنني إضافة عملي إلى الدليل؟",
          a: "بعد التسجيل، اذهب إلى لوحة التحكم واختر 'إضافة عمل جديد'. املأ المعلومات المطلوبة مثل الاسم، الفئة، الموقع، والوصف. يمكنك أيضاً إضافة صور وساعات العمل."
        },
        {
          q: "ما هي الخطط المدفوعة المتاحة؟",
          a: "نوفر خطط سنوية للظهور في الصفحة الرئيسية: خطة Homepage Top Yearly للظهور في أعلى 3 مراكز، وخطة Homepage Yearly للظهور في القسم المميز. تزيد هذه الخطط من وصولك بشكل كبير."
        },
        {
          q: "هل يمكنني تعديل معلومات عملي؟",
          a: "نعم، يمكنك تعديل جميع معلومات عملك في أي وقت من خلال لوحة التحكم. التحديثات تظهر فوراً على المنصة."
        },
      ]
    },
    {
      category: "بطاقة الولاء",
      questions: [
        {
          q: "كيف تعمل بطاقات الولاء الرقمية؟",
          a: "نوفر نظام بطاقات ولاء رقمي يعمل مع Apple Wallet و Google Wallet. يمكن للعملاء إضافة البطاقة مباشرة لمحفظتهم الرقمية وجمع النقاط أو الطوابع في كل زيارة."
        },
        {
          q: "ما هي أنواع بطاقات الولاء المتاحة؟",
          a: "نوفر نوعين: بطاقات النقاط (Points) حيث يجمع العميل نقاط مع كل عملية شراء، وبطاقات الطوابع (Stamps) حيث يحصل على طابع مع كل زيارة. يمكنك اختيار النظام الأنسب لعملك."
        },
        {
          q: "كيف يمكنني إدارة عملاء الولاء؟",
          a: "من خلال لوحة تحكم الولاء، يمكنك رؤية جميع العملاء، إصدار بطاقات جديدة، تحديث النقاط أو الطوابع، وإرسال إشعارات push للعملاء مباشرة على بطاقاتهم."
        },
      ]
    },
    {
      category: "منصة التسويق",
      questions: [
        {
          q: "ما هي منصة التسويق؟",
          a: "منصة التسويق توفر APIs متقدمة لواتساب وتلغرام تسمح لك بإرسال حملات تسويقية، أتمتة الردود، وإدارة محادثات العملاء من مكان واحد."
        },
        {
          q: "هل يمكنني إرسال رسائل جماعية؟",
          a: "نعم، يمكنك إنشاء حملات تسويقية وإرسالها لقوائم العملاء عبر واتساب أو تلغرام. المنصة توفر قوالب رسائل جاهزة وإمكانية تخصيص كامل."
        },
        {
          q: "هل المنصة متوافقة مع WhatsApp Business API؟",
          a: "نعم، نستخدم WhatsApp Business API الرسمي لضمان التوافق الكامل والأمان. يمكنك ربط رقم عملك والبدء فوراً."
        },
      ]
    },
    {
      category: "الأمان والخصوصية",
      questions: [
        {
          q: "كيف تحمون بياناتي؟",
          a: "نستخدم تشفير AES-256-GCM لحماية البيانات الحساسة، HTTPS لجميع الاتصالات، و JWT tokens آمنة للمصادقة. جميع البيانات محفوظة بشكل آمن ومشفر."
        },
        {
          q: "من يمكنه رؤية معلومات عملي؟",
          a: "المعلومات الأساسية مثل الاسم والفئة والموقع تكون عامة في الدليل. أما معلومات الاتصال والبيانات الحساسة فهي محمية ولا تظهر إلا لمن تحدده."
        },
        {
          q: "هل يمكنني حذف حسابي؟",
          a: "نعم، يمكنك حذف حسابك وجميع بياناتك في أي وقت من إعدادات الحساب. سيتم حذف جميع المعلومات نهائياً."
        },
      ]
    },
    {
      category: "الدعم والمساعدة",
      questions: [
        {
          q: "كيف يمكنني التواصل مع الدعم الفني؟",
          a: "يمكنك التواصل معنا عبر صفحة الاتصال، أو إرسال رسالة مباشرة من لوحة التحكم. فريق الدعم متاح للرد على استفساراتك."
        },
        {
          q: "هل توفرون تدريب على استخدام المنصة؟",
          a: "نعم، نوفر أدلة مفصلة ومقاطع فيديو تعليمية لجميع الميزات. يمكننا أيضاً توفير جلسات تدريب مخصصة للخطط المدفوعة."
        },
        {
          q: "ماذا أفعل إذا نسيت كلمة المرور؟",
          a: "استخدم خيار 'نسيت كلمة المرور' في صفحة تسجيل الدخول. سنرسل لك رابط إعادة تعيين كلمة المرور عبر البريد الإلكتروني."
        },
      ]
    },
  ] : [
    {
      category: "General",
      questions: [
        {
          q: "What is Smart Business Center?",
          a: "Smart Business Center is an integrated platform offering three main solutions: Business Directory, Digital Loyalty Cards, and Marketing Platform via WhatsApp and Telegram. We help businesses grow and reach new customers."
        },
        {
          q: "Is registration free?",
          a: "Yes, basic registration is completely free. You can create an account and add your business without any cost. We also offer paid plans for advanced features."
        },
        {
          q: "What languages are supported?",
          a: "The platform fully supports both Arabic and English with an automatically adaptive interface for text direction (RTL/LTR)."
        },
      ]
    },
    {
      category: "Business Directory",
      questions: [
        {
          q: "How can I add my business to the directory?",
          a: "After registration, go to your dashboard and select 'Add New Business'. Fill in required information such as name, category, location, and description. You can also add images and business hours."
        },
        {
          q: "What paid plans are available?",
          a: "We offer annual plans for homepage visibility: Homepage Top Yearly plan for top 3 positions, and Homepage Yearly plan for featured section. These plans significantly increase your reach."
        },
        {
          q: "Can I edit my business information?",
          a: "Yes, you can edit all your business information anytime from the dashboard. Updates appear immediately on the platform."
        },
      ]
    },
    {
      category: "Loyalty Card",
      questions: [
        {
          q: "How do digital loyalty cards work?",
          a: "We provide a digital loyalty card system that works with Apple Wallet and Google Wallet. Customers can add cards directly to their digital wallet and collect points or stamps with each visit."
        },
        {
          q: "What types of loyalty cards are available?",
          a: "We offer two types: Points cards where customers collect points with each purchase, and Stamps cards where they get a stamp with each visit. You can choose the system that best suits your business."
        },
        {
          q: "How can I manage loyalty customers?",
          a: "Through the loyalty dashboard, you can view all customers, issue new cards, update points or stamps, and send push notifications directly to their cards."
        },
      ]
    },
    {
      category: "Marketing Platform",
      questions: [
        {
          q: "What is the Marketing Platform?",
          a: "The Marketing Platform provides advanced APIs for WhatsApp and Telegram allowing you to send marketing campaigns, automate responses, and manage customer conversations from one place."
        },
        {
          q: "Can I send bulk messages?",
          a: "Yes, you can create marketing campaigns and send them to customer lists via WhatsApp or Telegram. The platform provides ready-made message templates and full customization."
        },
        {
          q: "Is the platform compatible with WhatsApp Business API?",
          a: "Yes, we use the official WhatsApp Business API to ensure full compatibility and security. You can link your business number and start immediately."
        },
      ]
    },
    {
      category: "Security & Privacy",
      questions: [
        {
          q: "How do you protect my data?",
          a: "We use AES-256-GCM encryption for sensitive data, HTTPS for all communications, and secure JWT tokens for authentication. All data is stored securely and encrypted."
        },
        {
          q: "Who can see my business information?",
          a: "Basic information like name, category, and location is public in the directory. Contact information and sensitive data are protected and only visible to those you specify."
        },
        {
          q: "Can I delete my account?",
          a: "Yes, you can delete your account and all your data anytime from account settings. All information will be permanently deleted."
        },
      ]
    },
    {
      category: "Support & Help",
      questions: [
        {
          q: "How can I contact technical support?",
          a: "You can contact us via the contact page, or send a direct message from your dashboard. Our support team is available to answer your questions."
        },
        {
          q: "Do you provide training on using the platform?",
          a: "Yes, we provide detailed guides and video tutorials for all features. We can also provide customized training sessions for paid plans."
        },
        {
          q: "What do I do if I forget my password?",
          a: "Use the 'Forgot Password' option on the login page. We'll send you a password reset link via email."
        },
      ]
    },
  ];

  return (
    <PublicPage>
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {locale === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {locale === "ar"
              ? "إجابات على الأسئلة الأكثر شيوعاً حول منصتنا وخدماتنا"
              : "Answers to the most common questions about our platform and services"}
          </p>
        </div>
        <Link
          href={`/${locale}/about`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {locale === "ar" ? "العودة" : "Back"}
        </Link>
      </div>

      {/* Search Box */}
      <FadeInSection duration={600} delay={0}>
        <div className="sbc-card rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-(--muted-foreground)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={locale === "ar" ? "ابحث في الأسئلة..." : "Search questions..."}
              className="flex-1 bg-transparent outline-none"
            />
          </div>
        </div>
      </FadeInSection>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {faqs.map((category, catIndex) => (
          <FadeInSection key={category.category} duration={600} delay={catIndex * 100}>
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-accent to-accent-2 rounded-full" />
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, qIndex) => (
                  <details
                    key={qIndex}
                    className="sbc-card sbc-card--interactive rounded-2xl p-6 group"
                  >
                    <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{faq.q}</h3>
                      </div>
                      <svg
                        className="h-5 w-5 text-(--muted-foreground) transition-transform group-open:rotate-180 shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="mt-4 pt-4 border-t border-(--surface-border)">
                      <p className="text-sm leading-7 text-(--muted-foreground)">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </FadeInSection>
        ))}
      </div>

      {/* Still Have Questions CTA */}
      <FadeInSection duration={700} delay={0}>
        <div className="mt-12 sbc-card rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <svg
                className="h-8 w-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-3">
            {locale === "ar" ? "لا زلت لديك أسئلة؟" : "Still have questions?"}
          </h3>
          <p className="text-sm text-(--muted-foreground) mb-6 max-w-lg mx-auto">
            {locale === "ar"
              ? "فريقنا هنا لمساعدتك. تواصل معنا وسنرد عليك في أقرب وقت ممكن."
              : "Our team is here to help. Contact us and we'll respond as soon as possible."}
          </p>
          <Link
            href={`/${locale}/contact`}
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            {locale === "ar" ? "تواصل معنا" : "Contact Us"}
          </Link>
        </div>
      </FadeInSection>
    </PublicPage>
  );
}
