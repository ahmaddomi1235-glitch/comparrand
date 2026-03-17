import { Lock, Database, Image, Cloud, Trash2 } from 'lucide-react';

const SECTIONS = [
  {
    icon: <Database size={22} />,
    title: 'ما الذي نحفظه؟',
    content: `نحفظ البيانات التالية محليًا في متصفحك فقط (localStorage):
• قائمة المفضلة: الأدوية التي أضفتها للمفضلة
• سجل البحث: آخر 10 عمليات بحث
• سجل المقارنات: آخر 5 مقارنات أجريتها
• نتائج تحليل الصور (إن طلبت حفظها)

هذه البيانات لا ترسل إلى أي خادم خارجي. تُحفظ فقط على جهازك وتُمسح إذا مسحت بيانات المتصفح.`,
  },
  {
    icon: <Image size={22} />,
    title: 'الصور والتحليل',
    content: `عند استخدام ميزة تحليل الصورة:
• الصورة لا تُرفع تلقائيًا إلى أي مكان
• عند الضغط على "تحليل الصورة" فقط تُرسل للخدمة الخارجية (Gemini 2.5 Flash من Google)
• في وضع العرض التجريبي (بدون مفتاح API)، لا ترسل أي بيانات خارج المتصفح
• عند تفعيل Gemini: الصورة ترسل مباشرة لـ Google Generative AI وتخضع لسياسة خصوصية Google
• لا نحتفظ بنسخ من الصور المرفوعة`,
  },
  {
    icon: <Cloud size={22} />,
    title: 'البيانات السحابية',
    content: `في هذه النسخة من المنصة:
• لا يوجد حساب مستخدم سحابي
• لا يوجد قاعدة بيانات خارجية
• لا ترسل بيانات شخصية إلى أي خادم
• الموقع static يعمل في متصفحك بالكامل`,
  },
  {
    icon: <Trash2 size={22} />,
    title: 'كيف تمسح بياناتك؟',
    content: `لمسح جميع البيانات المحفوظة:
• اذهب إلى إعدادات المتصفح → الخصوصية → مسح البيانات
• أو في المفضلة، اضغط "مسح الكل"
• أو في سجل البحث، اضغط على أيقونة الحذف`,
  },
];

export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
          <Lock size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-text-main mb-3">سياسة الخصوصية</h1>
        <p className="text-text-secondary">
          نحن نحترم خصوصيتك ونلتزم بالشفافية الكاملة حول ما نفعله ببياناتك.
        </p>
        <p className="text-xs text-text-secondary mt-2">آخر تحديث: مارس 2026</p>
      </div>

      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="bg-bg-surface border border-border-default rounded-card p-6 shadow-card"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-card bg-primary-light flex items-center justify-center text-primary">
                {section.icon}
              </div>
              <h2 className="text-lg font-bold text-text-main">{section.title}</h2>
            </div>
            <p className="text-text-secondary text-sm leading-loose whitespace-pre-line">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-info-bg border border-info-text/25 rounded-card p-5 text-center">
        <p className="text-info-text text-sm">
          إذا كانت لديك أي أسئلة أو مخاوف حول الخصوصية، فالمنصة مفتوحة المصدر ويمكنك
          مراجعة الكود مباشرةً للتحقق.
        </p>
      </div>
    </div>
  );
}
