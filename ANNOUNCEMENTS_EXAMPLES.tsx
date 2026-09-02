// 📄 مثال: كيفية استخدام نظام الإعلانات في الصفحات

import { useEffect, useState } from "react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { AnnouncementDialog } from "@/components/dialogs/AnnouncementDialog";

// مثال 1: عرض إعلان واحد
export function ExampleSingleAnnouncement() {
  const { announcements } = useAnnouncements();
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    // عرض الإعلان تلقائياً عند تحميل الصفحة
    if (announcements.length > 0 && !showAnnouncement) {
      setShowAnnouncement(true);
    }
  }, [announcements]);

  return (
    <div>
      {/* محتوى الصفحة */}
      <h1>الصفحة الرئيسية</h1>
      <p>مرحباً في التطبيق!</p>

      {/* عرض الإعلان */}
      <AnnouncementDialog
        announcement={showAnnouncement ? announcements[0] || null : null}
        onClose={() => setShowAnnouncement(false)}
      />
    </div>
  );
}

// مثال 2: عرض سلسلة من الإعلانات
export function ExampleMultipleAnnouncements() {
  const { announcements } = useAnnouncements();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleCloseAnnouncement = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // انتهت جميع الإعلانات
      console.log("تم عرض جميع الإعلانات");
    }
  };

  return (
    <div>
      <h1>الصفحة الرئيسية</h1>

      {/* عرض الإعلانات بالترتيب */}
      <AnnouncementDialog
        announcement={currentIndex < announcements.length ? announcements[currentIndex] : null}
        onClose={handleCloseAnnouncement}
      />
    </div>
  );
}

// مثال 3: عرض إعلانات مشروطة
export function ExampleConditionalAnnouncements() {
  const { announcements } = useAnnouncements();
  const [hasViewedAnnouncements, setHasViewedAnnouncements] = useState(() => {
    // تذكر الإعلانات التي شاهدها المستخدم
    const stored = localStorage.getItem("viewedAnnouncements");
    return stored ? JSON.parse(stored) : [];
  });

  const unviewedAnnouncements = announcements.filter(
    (a) => !hasViewedAnnouncements.includes(a.id)
  );

  const handleViewAnnouncement = (id: string) => {
    const updated = [...hasViewedAnnouncements, id];
    setHasViewedAnnouncements(updated);
    localStorage.setItem("viewedAnnouncements", JSON.stringify(updated));
  };

  return (
    <div>
      <h1>الصفحة الرئيسية</h1>

      {/* عرض الإعلانات غير المشاهدة فقط */}
      <AnnouncementDialog
        announcement={unviewedAnnouncements[0] || null}
        onClose={() => {
          if (unviewedAnnouncements[0]) {
            handleViewAnnouncement(unviewedAnnouncements[0].id);
          }
        }}
      />

      {/* عرض عدد الإعلانات المتبقية */}
      {unviewedAnnouncements.length > 0 && (
        <p className="text-sm text-muted-foreground">
          لديك {unviewedAnnouncements.length} إعلان جديد
        </p>
      )}
    </div>
  );
}

// مثال 4: دمج الإعلانات مع معلومات المستخدم
export function ExampleWithUserContext() {
  const { announcements, loading } = useAnnouncements();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div>
      <h1>لوحة التحكم</h1>

      {/* عرض عدد الإعلانات */}
      {announcements.length > 0 && (
        <div className="bg-blue-100 p-4 rounded mb-4">
          <p>📢 لديك {announcements.length} إعلان جديد</p>
        </div>
      )}

      {/* الإعلان */}
      <AnnouncementDialog
        announcement={announcements[currentIndex] || null}
        onClose={() => {
          if (currentIndex < announcements.length - 1) {
            setCurrentIndex(currentIndex + 1);
          }
        }}
      />

      {/* محتوى الصفحة */}
      <div className="mt-8">
        <h2>محتوى الصفحة</h2>
        <p>محتوى الصفحة الرئيسية هنا...</p>
      </div>
    </div>
  );
}

// مثال 5: إدارة الإعلانات في الإدارة
import { useAnnouncements } from "@/hooks/useAnnouncements";

export function ExampleAdminManagement() {
  const { announcements, add, remove, update } = useAnnouncements();

  // إضافة إعلان جديد
  const handleAddAnnouncement = async () => {
    await add({
      title: "الاختبار الأسبوعي",
      description: "تذكير بالاختبار الأسبوعي غداً",
      media_type: "image",
      media_url: "https://example.com/image.jpg",
      skip_delay_seconds: 10,
      is_active: true,
    });
  };

  // حذف إعلان
  const handleDeleteAnnouncement = async (id: string) => {
    await remove(id);
  };

  // تحديث إعلان
  const handleUpdateAnnouncement = async (id: string) => {
    await update(id, {
      is_active: false,
    });
  };

  return (
    <div>
      <h1>إدارة الإعلانات</h1>

      <button onClick={handleAddAnnouncement}>إضافة إعلان جديد</button>

      <div className="space-y-4 mt-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="border p-4">
            <h3>{announcement.title}</h3>
            <p>{announcement.description}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleUpdateAnnouncement(announcement.id)}>
                تحديث
              </button>
              <button onClick={() => handleDeleteAnnouncement(announcement.id)}>
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/*
📚 ملخص الأمثلة:

1. ExampleSingleAnnouncement
   ✅ عرض إعلان واحد فقط
   ✅ عرض تلقائي عند تحميل الصفحة
   ✅ مناسب للإعلانات المهمة

2. ExampleMultipleAnnouncements
   ✅ عرض سلسلة من الإعلانات
   ✅ عرض واحد تلو الآخر
   ✅ مناسب لعدة إعلانات

3. ExampleConditionalAnnouncements
   ✅ عرض الإعلانات غير المشاهدة فقط
   ✅ حفظ الإعلانات المشاهدة
   ✅ مناسب لعدم تكرار الإعلانات

4. ExampleWithUserContext
   ✅ دمج الإعلانات مع سياق المستخدم
   ✅ عرض عدد الإعلانات
   ✅ مناسب للتنبيهات

5. ExampleAdminManagement
   ✅ إدارة الإعلانات بالكامل
   ✅ إضافة، تحديث، حذف
   ✅ مناسب للإداريين

═══════════════════════════════════════════════════════════════════════════
*/
