import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert } from '../components/ui/Alert';

const TERMS = [
  {
    id: 1,
    title: 'الغرض من المنصة',
    content: 'منصة "قارن دواءك" مخصصة للتثقيف والمقارنة الدوائية فقط. المعلومات المقدمة لا تمثل وصفة طبية ولا نصيحة طبية متخصصة.',
    level: 'info' as const,
  },
  {
    id: 2,
    title: 'لا يجوز الاعتماد المنفرد',
    content: 'لا يجوز الاعتماد على هذه المنصة وحدها لاتخاذ أي قرار علاجي. يجب الرجوع دائمًا إلى صيدلاني أو طبيب مختص.',
    level: 'warning' as const,
  },
  {
    id: 3,
    title: 'الأدوية الحساسة',
    content: 'لا ينبغي استبدال الأدوية ذات النطاق العلاجي الضيق (أدوية القلب، الغدة الدرقية، الصرع، السكري...) دون الرجوع المباشر إلى طبيب أو صيدلاني.',
    level: 'danger' as const,
  },
  {
    id: 4,
    title: 'دقة الأسعار',
    content: 'الأسعار المعروضة استرشادية وقد تختلف بحسب السوق أو المصدر أو تاريخ الشراء. تحقق دائمًا من السعر الفعلي في الصيدلية.',
    level: 'warning' as const,
  },
  {
    id: 5,
    title: 'تحليل الصور',
    content: 'نتائج تحليل صور الأدوية أولية وقد تحتوي على أخطاء. تحقق دائمًا من اسم الدواء يدويًا قبل أي استخدام.',
    level: 'warning' as const,
  },
];

const ALLOWED = [
  'استخدام المنصة لأغراض البحث والتثقيف الشخصي',
  'مقارنة الأسعار للاطلاع والتوعية',
  'عرض المعلومات الدوائية للمناقشة مع الصيدلاني أو الطبيب',
  'حفظ الأدوية في المفضلة للرجوع إليها لاحقًا',
];

const NOT_ALLOWED = [
  'استخدام المنصة كمرجع طبي رسمي لاتخاذ قرارات علاجية',
  'استبدال الأدوية بناءً على نتائج المنصة فقط',
  'إهمال استشارة المختص الصحي',
  'نسخ أو توزيع المحتوى لأغراض تجارية دون إذن',
];

export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-warning-bg flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-warning-text" />
        </div>
        <h1 className="text-3xl font-bold text-text-main mb-3">الشروط والتنبيهات</h1>
        <p className="text-text-secondary">
          يرجى قراءة هذه الشروط والتنبيهات المهمة قبل استخدام المنصة.
        </p>
      </div>

      <div className="space-y-4 mb-10">
        {TERMS.map((term) => (
          <Alert key={term.id} variant={term.level} title={term.title}>
            <p className="text-sm leading-relaxed">{term.content}</p>
          </Alert>
        ))}
      </div>

      <div className="bg-bg-surface border border-border-default rounded-card p-6 mb-5 shadow-card">
        <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-success-text" />
          ما يُسمح به
        </h2>
        <ul className="space-y-2">
          {ALLOWED.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
              <CheckCircle2 size={15} className="text-success-text flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-danger-bg border border-danger-text/25 rounded-card p-6 mb-8">
        <h2 className="text-lg font-bold text-danger-text mb-4 flex items-center gap-2">
          <AlertTriangle size={20} />
          ما لا يُسمح به
        </h2>
        <ul className="space-y-2">
          {NOT_ALLOWED.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-danger-text">
              <span className="flex-shrink-0">✗</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-primary-light/30 border border-primary/20 rounded-card p-5 text-center">
        <p className="text-text-secondary text-sm">
          باستخدامك لهذه المنصة، فإنك توافق على الاستخدام المسؤول وفق هذه الشروط.
          صحتك أولوية — لا تتردد في الرجوع لمختص صحي.
        </p>
      </div>
    </div>
  );
}
