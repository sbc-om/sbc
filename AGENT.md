خیلی خوب، بریم روی نسخه حرفه‌ای و SaaS-ای، فقط با Google Wallet.

من طوری توضیح می‌دهم که بتوانی:

* برای خودت یک **Issuer** Google Wallet بسازی
* روی آن، برای هر بیزینس یک **Loyalty Program** تعریف کنی
* برای هر مشتری آن بیزینس، یک **کارت وفاداری شخصی** بسازی که در Google Wallet ذخیره شود
* بعداً امتیاز/سطح/وضعیت کارت را از سرور خودت آپدیت کنی

---

## 1. مفاهیم اصلی Google Wallet برای Loyalty

در Google Wallet سه مفهوم کلیدی داری:

1. **Issuer**

   * در واقع «صاحب» رسمی تمام کارت‌هایی است که می‌سازی.
   * معمولاً شرکت خودت خواهد بود (مثلاً SBC Loyalty Platform).
   * با Google ثبت می‌شود و یک `issuerId` می‌گیری.([Google for Developers][1])

2. **LoyaltyClass (کلاس برنامه وفاداری)**

   * تعریف ثابت یک برنامه وفاداری است: اسم برند، اسم برنامه، لوگو، رنگ، قوانین کلی، label امتیاز و…
   * ID به شکل `issuerId.classSuffix` است (مثلاً `1234567890.cafe_omani_gold`).([Google for Developers][2])

3. **LoyaltyObject (کارت واقعی برای هر کاربر)**

   * کارت شخصی هر مشتری است: شماره عضویت، نام مشتری، امتیاز فعلی، بارکد/QR، وضعیت ACTIVE یا BLOCKED و …
   * ID به شکل `issuerId.objectSuffix` (مثلاً `1234567890.cafe_omani_gold_user_42`).([Google for Developers][3])

برای ذخیره کارت در Wallet:

4. **JWT (JSON Web Token)**

   * یک توکن امضا شده است که داخلش اطلاعات pass یا فقط ID passها است.
   * ساختار اصلی:

     * `iss`: ایمیل Service Account
     * `aud`: مقدار ثابت `"google"`
     * `typ`: مقدار `"savetowallet"`
     * `payload`: شامل `loyaltyClasses` و/یا `loyaltyObjects`
   * با private_key سرویس‌اکانت امضا می‌شود (همان چیزی که به اسم `GOOGLE_WALLET_PRIVATE_KEY` می‌خواستی).([Google for Developers][4])

5. **Save URL**

   * آدرس نهایی که کاربر روی آن کلیک می‌کند:
   * `https://pay.google.com/gp/v/save/<JWT>`
   * می‌توانی این را روی وب، داخل اپ اندروید، یا به صورت QR Code ارائه کنی.([Google for Developers][5])

---

## 2. مدل SaaS: پلتفرم «Loyalty as a Service» برای بیزینس‌ها

مودلی که برای تو منطقی است:

* **یک Issuer واحد (سکوی SBC)**

  * همه کارت‌ها از نظر گوگل زیر نام تو صادر می‌شوند (تو به عنوان صادرکننده رسمی).
  * هر بیزینس در پلتفرم تو یک LoyaltyClass جدا دارد.

* برای هر **Business**:

  * یک یا چند LoyaltyClass (مثلاً یک برنامه عمومی، یک VIP Program)
  * UI کانفیگ: اسم برنامه، لوگو، رنگ پس‌زمینه، متن روی کارت، برچسب امتیاز (Points, Stars, etc.)

* برای هر **Customer** آن Business:

  * یک LoyaltyObject (کارت اختصاصی) که به LoyaltyClass آن بیزینس وصل است.

* پلتفرم تو:

  * Panel برای بیزینس‌ها: تعریف و تنظیم برنامه وفاداری
  * API عمومی/Private برای صدور کارت و آپدیت امتیاز
  * دکمه/لینک/QR “Add to Google Wallet”

این مدل، فروش سرویس به چند ده/چند صد بیزینس را ساده می‌کند، بدون این‌که هر بیزینس نیاز به دسترسی مستقیم به Google Cloud داشته باشد.

---

## 3. راه‌اندازی Google Wallet Issuer و Service Account

### 3.1. ساخت پروژه در Google Cloud

1. وارد Google Cloud Console شو.
2. یک Project جدید بساز، مثلاً: `sbc-loyalty-platform`.
3. از بخش **APIs & Services → Library**، `Google Wallet API` را پیدا و Enable کن.([Google for Developers][1])

### 3.2. تعریف Issuer

* باید یک **Issuer** برای Google Wallet بسازی (این بخش در کنسول Wallet یا API انجام می‌شود):

  * اسم برند پلتفرم (مثلاً: `SBC Loyalty Platform`)
  * اطلاعات تماس
  * لوگو
* بعد از تأیید، یک `issuerId` می‌گیری.([Google for Developers][1])

### 3.3. ساخت Service Account و private key

1. در بخش **IAM & Admin → Service Accounts**:

   * یک Service Account بساز (مثلاً: `wallet-api@sbc-loyalty.iam.gserviceaccount.com`).
2. برای آن، **JSON key** ایجاد و فایل را دانلود کن.
3. این JSON شامل:

   * `client_email` → در JWT به عنوان `iss` استفاده می‌شود.
   * `private_key` → همان چیزی که معمولاً در env به اسم `GOOGLE_WALLET_PRIVATE_KEY` می‌گذاری.([Google for Developers][6])

این Key فقط در Backend استفاده می‌شود، **هرگز** در Frontend / اپ موبایل قرار نده.

---

## 4. طراحی دیتامدل SaaS (چند بیزینسی)

فرض کن Backend را با **Node.js + TypeScript + Postgres** می‌سازی. اسکلت دیتابیس پیشنهادی:

### 4.1. جدول Business

* `id` (UUID)
* `name` (اسم بیزینس)
* `slug` (برای URL، مثلاً `cafe-omani`)
* `logo_url`
* `primary_color`
* `contact_email`
* `status` (ACTIVE / SUSPENDED)

### 4.2. جدول LoyaltyProgram (متصل به LoyaltyClass)

* `id` (UUID)
* `business_id` (FK → Business)
* `program_name` (مثلاً: “Café Omani Rewards”)
* `loyalty_class_id` (string – مثلاً: `1234567890.cafe_omani_rewards`)
* تنظیمات:

  * `points_label` (“Points”, “Stars”)
  * `earn_rule` (مثلاً: 1 امتیاز به ازای هر 1 OMR)
  * `tier_rules_json` (Silver/Gold/Platinum و… به صورت JSON)
  * `is_active`

### 4.3. جدول Customer

* `id` (UUID)
* `business_id` (FK → Business یا global user table)
* `full_name`
* `phone`
* `email`
* `external_id` (مثلاً ID مشتری در POS بیزینس)

### 4.4. جدول LoyaltyCard (متصل به LoyaltyObject)

* `id` (UUID)
* `customer_id` (FK)
* `loyalty_program_id` (FK)
* `loyalty_object_id` (string – مثلاً: `1234567890.cafe_omani_rewards_user_42`)
* `account_id` (شماره عضویت – برای مشتری روی کارت نمایش داده می‌شود)
* `points_balance` (آخرین امتیاز sync شده)
* `tier` (Silver/Gold…)
* `status` (ACTIVE / BLOCKED)

### 4.5. جدول Transactions / PointLedger (اختیاری ولی توصیه می‌شود)

* `id`
* `loyalty_card_id`
* `change` (مثلاً +10 امتیاز)
* `reason` (“Purchase”, “Manual Adjustment”)
* `created_at`

با این ساختار می‌توانی هر تعداد بیزینس و هر تعداد کارت برای مشتری‌ها داشته باشی.

---

## 5. ساخت LoyaltyClass برای هر بیزینس

### 5.1. JSON نمونه LoyaltyClass

یک ساختار حداقلی (برای هر بیزینس یک کلاس):

```json
{
  "id": "ISSUER_ID.cafe_omani_rewards",
  "issuerName": "SBC Loyalty Platform",
  "programName": "Cafe Omani Rewards",
  "reviewStatus": "UNDER_REVIEW",
  "programLogo": {
    "sourceUri": {
      "uri": "https://your-cdn.com/logos/cafe-omani.png"
    }
  },
  "hexBackgroundColor": "#1F2937",
  "loyaltyPoints": {
    "label": "Points"
  }
}
```

* فیلدهای کامل‌تر در مستندات `loyaltyClass` آمده است (مثلاً discoverableProgram, merchantSigninInfo, messages و …).([Google for Developers][2])

### 5.2. Endpoint REST برای ساخت کلاس

* URL: `POST https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass`
* Authorization: Bearer token بر اساس Service Account (OAuth2).([Google for Developers][7])

نمونه کد ساده با Node.js:

```ts
import { GoogleAuth } from "google-auth-library";
import fetch from "node-fetch";

const credentials = require("./service-account.json");
const issuerId = "YOUR_ISSUER_ID"; // از Google Wallet می‌گیری

async function createLoyaltyClass(classSuffix: string, data: {
  programName: string;
  logoUrl: string;
  backgroundColor: string;
}) {
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });

  const client = await auth.getClient();
  const accessToken = await (client as any).getAccessToken();

  const body = {
    id: `${issuerId}.${classSuffix}`,
    issuerName: "SBC Loyalty Platform",
    programName: data.programName,
    reviewStatus: "UNDER_REVIEW",
    programLogo: {
      sourceUri: { uri: data.logoUrl },
    },
    hexBackgroundColor: data.backgroundColor,
  };

  const res = await fetch(
    "https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken.token || accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create loyaltyClass: ${err}`);
  }

  const json = await res.json();
  return json;
}
```

در پنل خودت، وقتی یک Business جدید ثبت می‌شود و Program ایجاد می‌کند:

1. `classSuffix` یکتا بساز (مثلاً `businessSlug_rewards`).
2. تابع بالا را صدا بزن.
3. `loyalty_class_id` که ساختی (`issuerId.classSuffix`) را در جدول LoyaltyProgram ذخیره کن.

---

## 6. ساخت LoyaltyObject برای هر مشتری

### 6.1. JSON نمونه LoyaltyObject

حداقل:

```json
{
  "id": "ISSUER_ID.cafe_omani_rewards_user_42",
  "classId": "ISSUER_ID.cafe_omani_rewards",
  "state": "ACTIVE",
  "accountId": "OM-00042",
  "accountName": "Milad Raeisi",
  "barcode": {
    "type": "QR_CODE",
    "value": "OM-00042"
  },
  "loyaltyPoints": {
    "label": "Points",
    "balance": { "int": 150 }
  }
}
```

ساختار کامل در `loyaltyObject` reference توضیح داده شده است.([Google for Developers][3])

### 6.2. Endpoint REST برای ساخت Object

* URL: `POST https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject`
* Auth همانند قبل با Service Account.([Google for Developers][1])

نمونه کد Node.js:

```ts
async function createLoyaltyObject(objectSuffix: string, params: {
  classId: string;
  accountId: string;
  accountName: string;
  initialPoints: number;
}) {
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });

  const client = await auth.getClient();
  const accessToken = await (client as any).getAccessToken();

  const body = {
    id: `${issuerId}.${objectSuffix}`,
    classId: params.classId,
    state: "ACTIVE",
    accountId: params.accountId,
    accountName: params.accountName,
    barcode: {
      type: "QR_CODE",
      value: params.accountId,
    },
    loyaltyPoints: {
      label: "Points",
      balance: { int: params.initialPoints },
    },
  };

  const res = await fetch(
    "https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken.token || accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create loyaltyObject: ${err}`);
  }

  const json = await res.json();
  return json;
}
```

در منطق برنامه:

* وقتی کاربر در برنامه وفاداری یک بیزینس join می‌کند:

  1. در دیتابیس خودت Customer و LoyaltyCard بساز.
  2. `objectSuffix` منحصربه‌فرد (مثلاً `programId_userId`) بساز.
  3. `createLoyaltyObject` را صدا بزن.
  4. `loyalty_object_id` را روی کارت ذخیره کن.

---

## 7. ساخت JWT و لینک “Add to Google Wallet”

### 7.1. ساختار JWT برای Loyalty

مطابق مستند رسمی Google Wallet:([Google for Developers][4])

```json
{
  "iss": "service-account-email@project.iam.gserviceaccount.com",
  "aud": "google",
  "typ": "savetowallet",
  "payload": {
    "loyaltyObjects": [
      {
        "id": "ISSUER_ID.cafe_omani_rewards_user_42",
        "classId": "ISSUER_ID.cafe_omani_rewards"
      }
    ]
  }
}
```

می‌توانی کلاً Object را داخل JWT بفرستی (بدون این‌که قبلش با REST بسازی)، ولی برای SaaS تمیزتر است:

* Object را با API بسازی
* در JWT فقط `id` و `classId` بگذاری (سطح کنترل بیشتر روی errors و logging).

### 7.2. کد ساخت JWT در Node.js

می‌توانی از `jsonwebtoken` استفاده کنی یا پکیج آماده مثل `google-wallet` استفاده کنی.([npm][8])

نمونه:

```ts
import jwt from "jsonwebtoken";
const serviceAccount = require("./service-account.json");

function createAddToWalletJwt(objectId: string, classId: string, origins: string[]) {
  const claims = {
    iss: serviceAccount.client_email,
    aud: "google",
    typ: "savetowallet",
    origins, // مثلا ["https://sbc.om"]
    payload: {
      loyaltyObjects: [
        {
          id: objectId,
          classId: classId,
        },
      ],
    },
  };

  const token = jwt.sign(claims, serviceAccount.private_key, {
    algorithm: "RS256",
  });

  return token;
}
```

### 7.3. URL و دکمه

* URL نهایی:
  `https://pay.google.com/gp/v/save/${token}` ([Google for Developers][5])

در Web:

```html
<a href="https://pay.google.com/gp/v/save/{{token}}" target="_blank">
  <img src="https://developers.google.com/wallet/images/save-to-google-wallet-button.png" alt="Add to Google Wallet" />
</a>
```

در Android (کاتلین ساده):

```kotlin
val jwt = "TOKEN_FROM_SERVER"
val intent = Intent(Intent.ACTION_VIEW).apply {
    data = Uri.parse("https://pay.google.com/gp/v/save/$jwt")
}
startActivity(intent)
```

همین URL را می‌توانی به صورت QR Code روی میز/کانتر چاپ کنی.

---

## 8. آپدیت امتیاز و وضعیت کارت‌ها

وقتی کاربر خرید می‌کند یا امتیاز می‌گیرد:

1. در دیتابیس خودت Transaction ثبت کن.
2. `points_balance` را در جدول LoyaltyCard حساب و ذخیره کن.
3. با Google Wallet API، همان LoyaltyObject را **Patch/Update** کن.([Google for Developers][3])

Endpoint:

* `PATCH https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/{resourceId}`

نمونه Node:

```ts
async function updateLoyaltyPoints(loyaltyObjectId: string, newPoints: number) {
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });

  const client = await auth.getClient();
  const accessToken = await (client as any).getAccessToken();

  const body = {
    loyaltyPoints: {
      label: "Points",
      balance: { int: newPoints },
    },
  };

  const res = await fetch(
    `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(loyaltyObjectId)}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${accessToken.token || accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update loyaltyObject: ${err}`);
  }

  return res.json();
}
```

به همین روش می‌توانی:

* `state` را به `BLOCKED` تغییر بدهی
* `messages` اضافه کنی (پیغام روی کارت)
* `secondaryLoyaltyPoints` یا `linkedOfferIds` استفاده کنی برای تخفیف‌ها([Google for Developers][3])

---

## 9. امکانات پیشرفته برای سرویس حرفه‌ای

### 9.1. Discoverable Programs

Google Wallet می‌تواند برنامه وفاداری را در داخل Wallet قابل جستجو کند (کارت را از داخل Wallet ایجاد کنند). این بخش با `discoverableProgram` روی LoyaltyClass تنظیم می‌شود.([Google for Developers][2])

برای نسخه اول سرویس، الزامی نیست؛ ولی بعداً برای برندهای بزرگ جذاب است.

### 9.2. Offers و لینک‌کردن به Loyalty

می‌توانی **OfferObject** بسازی و آن را به LoyaltyObject لینک کنی (برای کوپن‌ها و تخفیف‌ها).([Google for Developers][1])

این قابلیت برای سرویس حرفه‌ای B2B کاربردی است (مثلاً کمپین "Buy 1 Get 1 Free" روی همه اعضای برنامه).

### 9.3. Multi-pass JWT

در یک JWT می‌توانی چند نوع pass مختلف اضافه کنی (offer + loyalty) یا چند کارت برای یک کاربر.([Google for Developers][5])

---

## 10. امنیت و مدیریت کلیدها

* فایل JSON Service Account را **فقط در سرور** نگه دار.

* از Secret Manager (مثلاً Google Secret Manager یا Vault) استفاده کن، نه env ساده روی GitHub.

* در Frontend / موبایل هیچ‌وقت:

  * `private_key`
  * `client_email`
  * Access token
    را expose نکن.

* فقط Backend:

  * JWT را می‌سازد
  * REST calls به Google Wallet می‌زند
  * URL نهایی را به کلاینت می‌دهد.

---

## 11. فلو کامل end-to-end برای یک بیزینس

برای این‌که تصویرت کامل شود، فلو را یک‌جا ببینیم:

1. **Onboard بیزینس در پلتفرم تو**

   * فرم ثبت نام (نام، لوگو، رنگ برند، نوع امتیاز…)
   * در Backend:

     * رکورد Business و LoyaltyProgram را می‌سازی
     * `classSuffix` تولید می‌کنی
     * `createLoyaltyClass` را صدا می‌زنی
     * `loyalty_class_id` را ذخیره می‌کنی

2. **کاربر نهایی (مشتری بیزینس) می‌خواهد کارت بگیرد**

   * وارد صفحه Join برنامه وفاداری (وب یا اپ) می‌شود
   * فرم: نام، موبایل، ایمیل …
   * در Backend:

     * Customer و LoyaltyCard را می‌سازی
     * `objectSuffix` تولید می‌کنی
     * `createLoyaltyObject` را صدا می‌زنی
     * `loyalty_object_id` را در کارت ذخیره می‌کنی
     * `createAddToWalletJwt` را صدا می‌زنی → `token`
     * آدرس `https://pay.google.com/gp/v/save/${token}` را برمی‌گردانی

3. **کاربر روی دکمه / لینک / QR کلیک می‌کند**

   * Google Wallet باز می‌شود
   * کارت نمایش داده می‌شود
   * کاربر روی “Save” می‌زند
   * کارت در کیف پول‌اش ذخیره می‌شود.([Google Codelabs][9])

4. **بعد از هر خرید**

   * POS بیزینس transaction را به API تو می‌فرستد (به همراه accountId یا loyalty_object_id)
   * تو در دیتابیس Transaction و امتیاز جدید را ثبت می‌کنی
   * API Google Wallet را با PATCH فراخوانی می‌کنی و `loyaltyPoints.balance.int` را آپدیت می‌کنی
   * امتیاز جدید روی کارت کاربر در Wallet دیده می‌شود.

---

## 12. قدم‌های عملی برای شروع پیاده‌سازی

اگر بخواهیم برای تو یک roadmap قابل اجرا بنویسم:

1. **در Google Cloud**

   * Project بساز
   * Google Wallet API را Enable کن
   * Issuer بساز و `issuerId` بگیر
   * Service Account + JSON key بساز

2. **در Backend** (مثلاً یک سرویس Node.js مستقل: `wallet-service`):

   * Service Account JSON را اضافه کن (خارج از Git)
   * توابع کمکی بساز:

     * `createLoyaltyClass`
     * `createLoyaltyObject`
     * `updateLoyaltyObject` (برای امتیاز)
     * `createAddToWalletJwt`

3. **دیتابیس و مدل‌ها** را طبق بخش ۴ پیاده کن.

4. **Endpoints داخلی** برای اپلیکیشن‌ها:

   * `POST /businesses/{id}/programs` → ساخت LoyaltyClass
   * `POST /programs/{id}/cards` → ساخت Object و برگرداندن AddToWallet URL
   * `POST /cards/{id}/earn` → افزایش امتیاز و sync با Wallet

5. **UI برای بیزینس‌ها** (پرتال مدیریت):

   * فرم ساخت برنامه وفاداری
   * نمایش لیست مشتریان و امتیازها

6. **UI برای کاربران نهایی**:

   * صفحه Join + دکمه “Add to Google Wallet” (Web)
   * یا Intent در اپ اندروید.

اگر دوست داری، در مرحله بعد می‌توانم برایت:

* ساختار دقیق جداول (مثلاً Prisma schema)،
* Endpointهای REST با مثال JSON request/response،
* یا یک flow خاص (مثلاً فقط “کافه” با قانون: ۱ امتیاز به ازای هر ۱ OMR)

را کامل‌تر و با جزئیات عملیاتی بنویسم. فقط بگو ترجیح می‌دهی اول روی کدام بخش (Backend / Panel بیزینس / Flow مشتری) تمرکز کنیم.

[1]: https://developers.google.com/wallet/reference/rest?utm_source=chatgpt.com "Google Wallet API | Reference Documentation"
[2]: https://developers.google.com/wallet/reference/rest/v1/loyaltyclass?utm_source=chatgpt.com "REST Resource: loyaltyclass | Reference Documentation"
[3]: https://developers.google.com/wallet/reference/rest/v1/loyaltyobject?utm_source=chatgpt.com "REST Resource: loyaltyobject | Reference Documentation"
[4]: https://developers.google.com/wallet/retail/loyalty-cards/use-cases/jwt?utm_source=chatgpt.com "Working with JSON Web Tokens (JWT) | Loyalty cards"
[5]: https://developers.google.com/wallet/generic/use-cases/save-multiple-pass-types?utm_source=chatgpt.com "Add multiple pass types | Generic pass"
[6]: https://developers.google.com/wallet/reference/rest/v1/Jwt?utm_source=chatgpt.com "Google Wallet API JWT | Reference Documentation"
[7]: https://developers.google.com/wallet/retail/loyalty-cards/use-cases/create?utm_source=chatgpt.com "Create Passes Classes and Passes Objects | Loyalty cards"
[8]: https://www.npmjs.com/package/google-wallet?activeTab=readme&utm_source=chatgpt.com "google-wallet"
[9]: https://codelabs.developers.google.com/add-to-wallet-android?utm_source=chatgpt.com "Create passes on Android using the Google Wallet API"
