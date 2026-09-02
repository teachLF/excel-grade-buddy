# دليل نظام الإعلانات

## نظرة عامة
تم إضافة نظام إعلانات متكامل يتيح للمسؤولين إرسال إعلانات مع صور أو فيديوهات مع خيارات التخطي.

## البنية المحدثة للملفات

```
all/src/
├── components/
│   ├── pages/              [جديد] - الصفحات الرئيسية
│   │   ├── Dashboard.tsx
│   │   ├── ClassPage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   ├── MyStatsPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── SourceCodeViewer.tsx
│   ├── dialogs/            [جديد] - مربعات الحوار
│   │   ├── ClassStatsDialog.tsx
│   │   ├── StudentNotesDialog.tsx
│   │   └── AnnouncementDialog.tsx [جديد]
│   ├── guards/             [جديد] - guards الصلاحيات
│   │   └── AdminGuard.tsx
│   ├── admin/              [جديد] - مكونات الإدارة
│   │   └── AdminPanel.tsx
│   └── ui/                 - مكونات UI
├── hooks/
│   ├── useAuth.tsx
│   ├── useIsAdmin.tsx
│   ├── use-mobile.tsx
│   └── useAnnouncements.tsx [جديد]
```

## الميزات الجديدة

### 1. **Hook للإعلانات** (useAnnouncements.tsx)
```typescript
const { announcements, loading, add, update, remove, reload } = useAnnouncements();
```

**الوظائف:**
- `announcements`: قائمة الإعلانات النشطة
- `add(announcement)`: إضافة إعلان جديد
- `update(id, updates)`: تحديث إعلان
- `remove(id)`: حذف إعلان
- `reload()`: تحديث قائمة الإعلانات

### 2. **مكون الإعلان** (AnnouncementDialog.tsx)
يعرض الإعلان في مربع حوار مع:
- ❌ عرض الصورة أو الفيديو
- ⏱️ عداد التخطي (ثواني)
- 🔘 زر التخطي (بعد انتهاء المدة)
- 🎬 عناصم تحكم الفيديو

### 3. **واجهة إدارة الإعلانات** (AdminPanel.tsx)
تابع جديد في لوحة المسؤول:

**إضافة إعلان جديد:**
- ✍️ عنوان + وصف
- 📊 نوع الوسائط (صورة/فيديو)
- 🔗 رابط الوسائط
- ⏰ مدة التخطي (بالثواني)
- ✅ تفعيل/تعطيل الإعلان

**إدارة الإعلانات:**
- 👁️ معاينة الوسائط
- 🗑️ حذف الإعلان
- 📋 عرض تفاصيل الإعلان

## قاعدة البيانات

### جدول `announcements`
```sql
{
  id: UUID,                    -- معرف فريد
  title: TEXT,                 -- عنوان الإعلان
  description: TEXT,           -- وصف الإعلان
  media_type: TEXT,           -- 'video' أو 'image'
  media_url: TEXT,            -- رابط الوسائط
  skip_delay_seconds: INTEGER, -- ثواني التخطي (افتراضياً: 5)
  is_active: BOOLEAN,         -- هل الإعلان نشط
  created_at: TIMESTAMP,      -- وقت الإنشاء
  updated_at: TIMESTAMP       -- آخر تحديث
}
```

### الصلاحيات (RLS)
- ✅ الجميع يمكنهم عرض الإعلانات النشطة
- 🔒 فقط الإداريين يمكنهم إنشاء/تحديث/حذف

## كيفية الاستخدام

### 1. **إنشاء جدول الإعلانات**
شغّل هذا الأمر في Supabase SQL Editor:
```sql
-- انسخ محتوى ملف:
supabase/migrations/20260901_create_announcements_table.sql
```

### 2. **إضافة إعلان في لوحة المسؤول**
```
1. اذهب إلى لوحة المسؤول
2. انقر على تبويب "الإعلانات"
3. اضغط على "إعلان جديد"
4. املأ النموذج:
   - العنوان والوصف
   - نوع الوسائط (صورة أو فيديو)
   - رابط الوسائط (URL)
   - مدة التخطي بالثواني
5. اضغط "إضافة الإعلان"
```

### 3. **عرض الإعلان للمستخدمين**
في صفحة رئيسية (مثل Dashboard):
```typescript
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { AnnouncementDialog } from "@/components/dialogs/AnnouncementDialog";

function Dashboard() {
  const { announcements } = useAnnouncements();
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  return (
    <div>
      {/* محتوى الصفحة */}
      <AnnouncementDialog
        announcement={announcements[currentAnnouncement] || null}
        onClose={() => {
          if (currentAnnouncement < announcements.length - 1) {
            setCurrentAnnouncement(currentAnnouncement + 1);
          }
        }}
      />
    </div>
  );
}
```

## أمثلة على الإعلانات

### مثال 1: إعلان صورة
```javascript
{
  title: "الختبار الأسبوعي",
  description: "تذكير بالاختبار الأسبوعي غداً الساعة 10 صباحاً",
  media_type: "image",
  media_url: "https://example.com/exam-reminder.jpg",
  skip_delay_seconds: 10,
  is_active: true
}
```

### مثال 2: إعلان فيديو
```javascript
{
  title: "فيديو تعليمي جديد",
  description: "شرح موضوع الدرس الجديد بالتفصيل",
  media_type: "video",
  media_url: "https://example.com/lesson.mp4",
  skip_delay_seconds: 15,
  is_active: true
}
```

## الخطوات التالية (اختيارية)

1. **إضافة جدولة الإعلانات**: إضافة حقل `scheduled_at` لإظهار الإعلانات في وقت معين
2. **تتبع المشاهدات**: إضافة جدول لتسجيل من شاهد الإعلان
3. **استهداف المستخدمين**: إضافة حقول لاستهداف فئات معينة من المستخدمين
4. **النسخة الغنية**: دعم HTML/Markdown في الإعلانات

## ملاحظات مهمة

- ✅ جميع العمليات محمية برسائل خطأ واضحة بالعربية
- ✅ المسارات محدثة من `components/` إلى `components/pages/` و`components/dialogs/` إلخ
- ✅ صفر أخطاء TypeScript
- ✅ جميع الـ imports محدثة في جميع الملفات
