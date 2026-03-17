import { Eye, Target, Shield, Users, Zap } from 'lucide-react';
import { APP_OWNER, APP_DEVELOPER } from '../constants';

const VALUES = [
  { icon: <Eye size={28} />, title: 'الشفافية', desc: 'نؤمن بحق المريض في معرفة ما يأخذه وما يدفعه.' },
  { icon: <Target size={28} />, title: 'الوضوح', desc: 'نقدم المعلومات بأسلوب واضح يفهمه الجميع.' },
  { icon: <Shield size={28} />, title: 'الاستخدام الآمن', desc: 'نضع التنبيهات الطبية في المقدمة دائمًا.' },
  { icon: <Users size={28} />, title: 'مساعدة المريض', desc: 'هدفنا تمكين المريض من اتخاذ قرار واعٍ ومدروس.' },
  { icon: <Zap size={28} />, title: 'السهولة والسرعة', desc: 'واجهة سريعة وسهلة تعطيك الإجابة في ثوانٍ.' },
];

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="w-14 h-14 rounded-card bg-primary flex items-center justify-center text-white text-2xl font-extrabold shadow">
            ق
          </span>
          <h1 className="text-3xl font-extrabold text-text-main">قارن دواءك</h1>
        </div>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          منصة صيدلانية رقمية مستقلة مخصصة للسوق الأردني، تهدف إلى زيادة الشفافية في سوق
          الدواء وتمكين المريض من الوصول لمعلومات واضحة ودقيقة.
        </p>
        <div className="mt-4 inline-block px-4 py-1.5 bg-primary-light text-primary text-sm font-semibold rounded-full">
          السوق الأردني — الأسعار بالدينار الأردني (JOD)
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-card p-8 mb-8 shadow-card">
        <h2 className="text-2xl font-bold text-text-main mb-4">رسالتنا</h2>
        <p className="text-text-secondary leading-relaxed mb-4">
          نؤمن بأن كل شخص يستحق أن يفهم الدواء الذي يتناوله. قارن دواءك تعمل على تبسيط
          المعلومات الدوائية وتقديمها بصورة واضحة ومنظمة، مع التركيز على مساعدة المريض
          في السوق الأردني على فهم الفروق بين الأدوية والبدائل المتاحة.
        </p>
        <p className="text-text-secondary leading-relaxed">
          نؤكد دائمًا أن منصتنا للتثقيف والمقارنة فقط، ولا تحل محل الصيدلاني أو الطبيب
          المختص في الأردن. بل هدفنا أن تصل إلى مختصك وأنت حاملٌ لمعرفة أفضل.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-main mb-6">قيمنا</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VALUES.map((val) => (
            <div key={val.title} className="bg-bg-surface border border-border-default rounded-card p-6 shadow-card">
              <div className="w-12 h-12 rounded-card bg-primary-light flex items-center justify-center text-primary mb-4">
                {val.icon}
              </div>
              <h3 className="font-bold text-text-main mb-2">{val.title}</h3>
              <p className="text-text-secondary text-sm">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-card p-6 mb-8 shadow-card">
        <h2 className="text-xl font-bold text-text-main mb-4">الفريق</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-bg-page rounded-card">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              R
            </div>
            <div>
              <p className="font-bold text-text-main">{APP_OWNER}</p>
              <p className="text-sm text-text-secondary">Owner</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-bg-page rounded-card">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-text-main font-bold text-lg flex-shrink-0">
              A
            </div>
            <div>
              <p className="font-bold text-text-main">{APP_DEVELOPER}</p>
              <p className="text-sm text-text-secondary">Developed by</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-warning-bg border border-warning-text/25 rounded-card p-6">
        <h2 className="text-lg font-bold text-warning-text mb-4">⚠️ ما نحن لسنا</h2>
        <ul className="space-y-2 text-sm text-warning-text">
          {[
            'لسنا بديلاً عن الصيدلاني أو الطبيب في الأردن',
            'لا نقدم تشخيصًا طبيًا أو وصفة علاجية',
            'معلوماتنا للتثقيف وليست للاستخدام الطبي المباشر',
            'الأسعار بالدينار الأردني وقد تختلف عن أسعار الصيدليات الفعلية',
            'نتائج تحليل الصور أولية وتحتاج تحققًا يدويًا',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
