import { notFound } from "next/navigation";
import Link from "next/link";

import { PublicPage } from "@/components/PublicPage";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { buttonVariants } from "@/components/ui/Button";
import { FadeInSection } from "@/components/FadeInSection";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <PublicPage>
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {locale === "ar" ? "شروط الخدمة" : "Terms of Service"}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {locale === "ar"
              ? "آخر تحديث: 22 يناير 2026"
              : "Last updated: January 22, 2026"}
          </p>
        </div>
        <Link
          href={`/${locale}/about`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {locale === "ar" ? "العودة" : "Back"}
        </Link>
      </div>

      {/* Intro */}
      <FadeInSection duration={600} delay={0}>
        <div className="sbc-card rounded-2xl p-8 mb-8">
          <p className="text-base leading-7 text-(--muted-foreground)">
            {locale === "ar"
              ? "مرحباً بك في Smart Business Center. باستخدامك لخدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية."
              : "Welcome to Smart Business Center. By using our services, you agree to comply with these terms and conditions. Please read them carefully."}
          </p>
        </div>
      </FadeInSection>

      {/* Terms Sections */}
      <div className="space-y-6">
        <FadeInSection duration={600} delay={100}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                1
              </span>
              {locale === "ar" ? "قبول الشروط" : "Acceptance of Terms"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "من خلال الوصول إلى واستخدام Smart Business Center، فإنك توافق على الالتزام بهذه الشروط والأحكام، وجميع القوانين واللوائح المعمول بها. إذا كنت لا توافق على أي من هذه الشروط، فلا يُسمح لك باستخدام هذه المنصة."
                  : "By accessing and using Smart Business Center, you agree to be bound by these Terms and Conditions, and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform."}
              </p>
              <p>
                {locale === "ar"
                  ? "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية، واستمرارك في استخدام المنصة بعد هذه التغييرات يعتبر قبولاً لها."
                  : "We reserve the right to modify these terms at any time. You will be notified of any material changes, and your continued use of the platform after such changes constitutes acceptance."}
              </p>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={150}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                2
              </span>
              {locale === "ar" ? "استخدام الخدمات" : "Use of Services"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p className="font-semibold text-foreground">
                {locale === "ar" ? "الحسابات والتسجيل:" : "Accounts and Registration:"}
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>
                  {locale === "ar"
                    ? "يجب أن تكون 18 عاماً على الأقل لاستخدام هذه المنصة"
                    : "You must be at least 18 years old to use this platform"}
                </li>
                <li>
                  {locale === "ar"
                    ? "يجب تقديم معلومات دقيقة وكاملة عند التسجيل"
                    : "You must provide accurate and complete information when registering"}
                </li>
                <li>
                  {locale === "ar"
                    ? "أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور"
                    : "You are responsible for maintaining the confidentiality of your account and password"}
                </li>
                <li>
                  {locale === "ar"
                    ? "أنت مسؤول عن جميع الأنشطة التي تحدث تحت حسابك"
                    : "You are responsible for all activities that occur under your account"}
                </li>
              </ul>

              <p className="font-semibold text-foreground pt-4">
                {locale === "ar" ? "الاستخدام المقبول:" : "Acceptable Use:"}
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>
                  {locale === "ar"
                    ? "استخدام المنصة للأغراض القانونية فقط"
                    : "Use the platform for lawful purposes only"}
                </li>
                <li>
                  {locale === "ar"
                    ? "عدم نشر محتوى مسيء أو غير لائق أو مضلل"
                    : "Do not post offensive, inappropriate, or misleading content"}
                </li>
                <li>
                  {locale === "ar"
                    ? "عدم محاولة الوصول غير المصرح به إلى أنظمتنا"
                    : "Do not attempt unauthorized access to our systems"}
                </li>
                <li>
                  {locale === "ar"
                    ? "احترام حقوق الملكية الفكرية للآخرين"
                    : "Respect the intellectual property rights of others"}
                </li>
              </ul>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={200}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10 text-accent-2 font-bold">
                3
              </span>
              {locale === "ar" ? "قوائم الأعمال" : "Business Listings"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "عند إضافة عملك إلى الدليل، فإنك تضمن أن جميع المعلومات المقدمة دقيقة وحديثة. أنت مسؤول عن:"
                  : "When adding your business to the directory, you warrant that all information provided is accurate and current. You are responsible for:"}
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>
                  {locale === "ar"
                    ? "صحة جميع معلومات العمل المقدمة"
                    : "Accuracy of all business information provided"}
                </li>
                <li>
                  {locale === "ar"
                    ? "امتلاك الحقوق القانونية لتمثيل العمل"
                    : "Having legal rights to represent the business"}
                </li>
                <li>
                  {locale === "ar"
                    ? "تحديث المعلومات بانتظام"
                    : "Regularly updating information"}
                </li>
                <li>
                  {locale === "ar"
                    ? "الامتثال لجميع القوانين واللوائح المحلية"
                    : "Compliance with all local laws and regulations"}
                </li>
              </ul>
              <p className="pt-2">
                {locale === "ar"
                  ? "نحتفظ بالحق في مراجعة وإزالة أي قائمة أعمال لا تلتزم بمعاييرنا أو هذه الشروط."
                  : "We reserve the right to review and remove any business listing that does not comply with our standards or these terms."}
              </p>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={250}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10 text-accent-2 font-bold">
                4
              </span>
              {locale === "ar" ? "الخطط المدفوعة" : "Paid Plans"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "بالنسبة للخدمات المدفوعة (مثل Homepage Top Yearly، Homepage Yearly، برامج الولاء، منصة التسويق):"
                  : "For paid services (such as Homepage Top Yearly, Homepage Yearly, Loyalty programs, Marketing Platform):"}
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>
                  {locale === "ar"
                    ? "يتم تجديد الاشتراكات السنوية تلقائياً ما لم يتم الإلغاء"
                    : "Annual subscriptions renew automatically unless canceled"}
                </li>
                <li>
                  {locale === "ar"
                    ? "جميع الأسعار بالدولار الأمريكي ما لم يُذكر خلاف ذلك"
                    : "All prices are in OMR unless otherwise stated"}
                </li>
                <li>
                  {locale === "ar"
                    ? "لا يتم استرداد المبالغ المدفوعة إلا في ظروف استثنائية"
                    : "Refunds are only provided in exceptional circumstances"}
                </li>
                <li>
                  {locale === "ar"
                    ? "يمكنك إلغاء اشتراكك في أي وقت قبل تاريخ التجديد"
                    : "You may cancel your subscription anytime before the renewal date"}
                </li>
              </ul>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={300}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                5
              </span>
              {locale === "ar" ? "الملكية الفكرية" : "Intellectual Property"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "جميع محتويات المنصة، بما في ذلك النصوص والرسومات والشعارات والأيقونات والصور والبرامج، هي ملك لـ Smart Business Center أو مرخصة لها، ومحمية بموجب قوانين حقوق النشر والملكية الفكرية."
                  : "All platform content, including text, graphics, logos, icons, images, and software, is owned by or licensed to Smart Business Center and protected by copyright and intellectual property laws."}
              </p>
              <p>
                {locale === "ar"
                  ? "أنت تحتفظ بحقوق الملكية للمحتوى الذي تنشره، ولكنك تمنحنا ترخيصاً غير حصري لاستخدامه وعرضه على المنصة."
                  : "You retain ownership rights to content you post, but grant us a non-exclusive license to use and display it on the platform."}
              </p>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={350}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                6
              </span>
              {locale === "ar" ? "الخصوصية والبيانات" : "Privacy and Data"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "استخدامك للمنصة خاضع أيضاً لسياسة الخصوصية الخاصة بنا. نحن نستخدم تدابير أمنية متقدمة لحماية بياناتك، بما في ذلك:"
                  : "Your use of the platform is also subject to our Privacy Policy. We use advanced security measures to protect your data, including:"}
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>
                  {locale === "ar"
                    ? "تشفير AES-256-GCM للبيانات الحساسة"
                    : "AES-256-GCM encryption for sensitive data"}
                </li>
                <li>
                  {locale === "ar"
                    ? "HTTPS لجميع الاتصالات"
                    : "HTTPS for all communications"}
                </li>
                <li>
                  {locale === "ar"
                    ? "JWT tokens آمنة للمصادقة"
                    : "Secure JWT tokens for authentication"}
                </li>
                <li>
                  {locale === "ar"
                    ? "تخزين آمن في قاعدة بيانات PostgreSQL"
                    : "Secure storage in PostgreSQL database"}
                </li>
              </ul>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={400}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10 text-accent-2 font-bold">
                7
              </span>
              {locale === "ar" ? "إخلاء المسؤولية" : "Disclaimer"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "المنصة والخدمات مقدمة 'كما هي' دون أي ضمانات. نحن لا نضمن:"
                  : "The platform and services are provided 'as is' without warranties. We do not guarantee:"}
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>
                  {locale === "ar"
                    ? "التشغيل المستمر وغير المنقطع للمنصة"
                    : "Continuous and uninterrupted operation of the platform"}
                </li>
                <li>
                  {locale === "ar"
                    ? "دقة أو اكتمال المعلومات المقدمة من المستخدمين"
                    : "Accuracy or completeness of user-provided information"}
                </li>
                <li>
                  {locale === "ar"
                    ? "أن المنصة خالية تماماً من الأخطاء أو الفيروسات"
                    : "That the platform is completely error-free or virus-free"}
                </li>
              </ul>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={450}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10 text-accent-2 font-bold">
                8
              </span>
              {locale === "ar" ? "حدود المسؤولية" : "Limitation of Liability"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "بأقصى حد يسمح به القانون، لن تكون Smart Business Center مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية ناتجة عن استخدامك أو عدم قدرتك على استخدام المنصة."
                  : "To the maximum extent permitted by law, Smart Business Center shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use or inability to use the platform."}
              </p>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={500}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                9
              </span>
              {locale === "ar" ? "الإنهاء" : "Termination"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "يمكننا إنهاء أو تعليق وصولك إلى المنصة فوراً، دون إشعار مسبق، لأي سبب، بما في ذلك انتهاك هذه الشروط. يمكنك أيضاً إنهاء حسابك في أي وقت من خلال إعدادات الحساب."
                  : "We may terminate or suspend your access to the platform immediately, without prior notice, for any reason, including violation of these terms. You may also terminate your account anytime through account settings."}
              </p>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={550}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                10
              </span>
              {locale === "ar" ? "القانون الحاكم" : "Governing Law"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "تخضع هذه الشروط وتُفسر وفقاً لقوانين البلد الذي تتخذ فيه Smart Business Center مقرها، دون النظر إلى تعارض أحكام القانون."
                  : "These terms shall be governed by and construed in accordance with the laws of the country where Smart Business Center is headquartered, without regard to conflict of law provisions."}
              </p>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={600}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10 text-accent-2 font-bold">
                11
              </span>
              {locale === "ar" ? "التغييرات على الشروط" : "Changes to Terms"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنقوم بنشر أي تغييرات على هذه الصفحة وتحديث تاريخ 'آخر تحديث'. استمرارك في استخدام المنصة بعد أي تغييرات يشير إلى قبولك للشروط الجديدة."
                  : "We reserve the right to modify these terms at any time. We will post any changes on this page and update the 'Last updated' date. Your continued use of the platform after any changes indicates your acceptance of the new terms."}
              </p>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={650}>
          <div className="sbc-card rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10 text-accent-2 font-bold">
                12
              </span>
              {locale === "ar" ? "اتصل بنا" : "Contact Us"}
            </h2>
            <div className="space-y-4 text-sm leading-7 text-(--muted-foreground) mr-[52px]">
              <p>
                {locale === "ar"
                  ? "إذا كانت لديك أي أسئلة حول هذه الشروط، يرجى الاتصال بنا عبر:"
                  : "If you have any questions about these terms, please contact us via:"}
              </p>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center text-accent hover:underline font-medium"
              >
                {locale === "ar" ? "صفحة الاتصال" : "Contact Page"}
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* Bottom CTA */}
      <FadeInSection duration={700} delay={0}>
        <div className="mt-12 sbc-card rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-3">
            {locale === "ar"
              ? "هل توافق على هذه الشروط؟"
              : "Do you agree to these terms?"}
          </h3>
          <p className="text-sm text-(--muted-foreground) mb-6 max-w-lg mx-auto">
            {locale === "ar"
              ? "باستخدامك لمنصتنا، فإنك تقر بأنك قد قرأت وفهمت ووافقت على هذه الشروط."
              : "By using our platform, you acknowledge that you have read, understood, and agree to these terms."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/register`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {locale === "ar" ? "إنشاء حساب" : "Create Account"}
            </Link>
            <Link
              href={`/${locale}/faq`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {locale === "ar" ? "الأسئلة الشائعة" : "FAQ"}
            </Link>
          </div>
        </div>
      </FadeInSection>
    </PublicPage>
  );
}
