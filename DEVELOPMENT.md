# دليل التطوير والإصلاح

## دليل سريع للمبتدئين 🚀

### ماذا يفعل هذا الموقع؟
موقع `teachLF` (متابعة الطلاب) هو نظام متقدم يساعد المعلمات على:
- تسجيل حضور وغياب الطالبات
- تسجيل الملاحظات السلوكية
- حساب النقاط تلقائياً
- عرض إحصائيات الطالبة بشكل خاص

## بنية المشروع 📂

```
excel-grade-buddy/
├── all/src/                    # الكود الرئيسي
│   ├── components/             # مكونات React
│   │   ├── Dashboard.tsx       # الصفحة الرئيسية للمعلم
│   │   ├── ClassPage.tsx       # إدارة الفصل الواحد\n│   │   ├── LoginPage.tsx       # صفحة تسجيل الدخول
│   │   ├── AdminPanel.tsx      # لوحة المسؤول
│   │   ├── MyStatsPage.tsx     # إحصائيات الطالبة
│   │   └── ...                 # مكونات أخرى
│   ├── routes/                 # مسارات التطبيق
│   ├── hooks/                  # دوال Hook مخصصة\n│   ├── integrations/           # التكامل مع الخدمات
│   ├── lib/                    # دوال مساعدة
│   └── start.ts                # نقطة بداية التطبيق
├── vite.config.ts              # إعدادات Vite
├── tsconfig.json               # إعدادات TypeScript
├── package.json                # المكتبات والأوامر
└── README.md                   # التوثيق الرئيسي
```

## الملفات المهمة والعاملة ✅

### الخطافات (Hooks)
- **`useAuth.tsx`** - إدارة المصادقة والجلسات
- **`useIsAdmin.tsx`** - التحقق من صلاحيات المسؤول

### صفحات الفصل
- **`Dashboard.tsx`** - لوحة تحكم المعلم الرئيسية
- **`ClassPage.tsx`** - إدارة فصل دراسي واحد
- **`LoginPage.tsx`** - تسجيل الدخول والتسجيل

### الصفحات الإدارية
- **`AdminPanel.tsx`** - إدارة حسابات المستخدمين
- **`AdminGuard.tsx`** - حماية الصفحات الإدارية
- **`SourceCodeViewer.tsx`** - عرض أكواد الموقع

### صفحات الطالبات
- **`MyStatsPage.tsx`** - إحصائيات الطالبة الشخصية
- **`LeaderboardPage.tsx`** - لوحة الصدارة الشاملة

## كيفية إضافة ميزة جديدة ➕

### مثال: إضافة زر جديد
1. افتح الملف `Dashboard.tsx`
2. أضف الزر في JSX:
```tsx
<Button onClick={myNewFunction}>
  جديد
</Button>
```
3. أضف الدالة:
```tsx
const myNewFunction = async () => {
  // الكود هنا
};
```

### مثال: إضافة استعلام قاعدة بيانات
```tsx
const { data, error } = await supabase
  .from(\"table_name\")
  .select(\"*\")
  .eq(\"id\", id);
  
if (error) {
  console.error(\"Query failed\", error);
  toast.error(\"حدث خطأ\");
} else {
  // استخدم البيانات
}
```

## معالجة الأخطاء 🔴

### النمط المتبع
```tsx
try {
  // محاولة تنفيذ العملية
  const { data, error } = await supabase.from(\"...\").select(\"...\");
  if (error) {
    console.error(\"[ComponentName] Query failed\", error);
    toast.error(\"رسالة خطأ واضحة\");
    return;
  }
  // استخدام البيانات
} catch (err) {
  console.error(\"[ComponentName] Query exception\", err);
  toast.error(\"حدث خطأ غير متوقع\");
}
```

## التصحيح والاختبار 🧪

### فتح وحدة التحكم
- في المتصفح: اضغط `F12`
- ابحث عن `[ComponentName]` في السجل

### رسائل الخطأ الشائعة
- **\"Profile bootstrap failed\"** - مشكلة في إنشاء ملف المستخدم
- **\"Query failed\"** - مشكلة في قاعدة البيانات
- **\"Unauthorized\"** - المستخدم ليس مصرح له بهذه العملية

## المتطلبات البيئية 🔑

### متغيرات البيئة المطلوبة
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_PROJECT_ID=...
```

## الأوامر المتاحة 💻

```bash
npm run dev        # تشغيل الموقع محلياً
npm run build      # بناء الإصدار الإنتاجي
npm run preview    # عرض الإصدار المبني
npm run lint       # فحص الأخطاء
npm run format     # تنسيق الكود
```

## نصائح للتطوير 💡

### استخدام Supabase
```tsx
// استيراد Supabase
import { supabase } from \"@/integrations/supabase/client\";

// جلب البيانات
const { data } = await supabase
  .from(\"جدول\")
  .select(\"*\");
```

### استخدام React Router
```tsx
// الملاحة
const navigate = useNavigate();
navigate({ to: \"/path\" });

// الحصول على المعاملات
const { id } = Route.useParams();
```

### عرض الرسائل
```tsx
// استيراد toast
import { toast } from \"sonner\";

// عرض الرسائل
toast.success(\"نجح!\");
toast.error(\"حدث خطأ!\");
toast.info(\"معلومة\");
```

## البث المباشر والنشر 📡

### نشر على الإنتاج
1. تأكد من أن الكود يعمل محلياً بدون أخطاء
2. اختبر جميع الميزات الجديدة
3. ثم انشر الكود

## الدعم الفني 🆘

### مشاكل شائعة وحلولها

**المشكلة**: الموقع أبيض فارغ
- **الحل**: افتح وحدة التحكم (F12) وابحث عن الأخطاء

**المشكلة**: لا يمكن تسجيل الدخول
- **الحل**: تحقق من اتصالك بالإنترنت والبريد الإلكتروني

**المشكلة**: الصور لا تظهر
- **الحل**: تحقق من رابط الصور في الكود

---

**ملاحظة**: هذا المشروع يستخدم تقنيات حديثة مثل React 19 و TanStack Router. تأكد من معرفتك بها قبل التطوير.

**آخر تحديث**: سبتمبر 2026
