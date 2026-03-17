import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Camera, X, Check,
  Search, Loader2, Image as ImageIcon,
} from 'lucide-react';
import type { ImageAnalysisState } from '../types';
import { analyzeMedicineImage, isGeminiConfigured, getGeminiMode } from '../services/GIMINI';
import { validateImageFile } from '../utils';
import { IMAGE_UPLOAD, ROUTES } from '../constants';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';

const INITIAL_STATE: ImageAnalysisState = {
  status: 'idle',
  result: null,
  error: null,
  previewUrl: null,
};

export function ImageAnalysisPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImageAnalysisState>(INITIAL_STATE);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((selectedFile: File) => {
    const validation = validateImageFile(selectedFile);
    if (!validation.valid) {
      setState({ ...INITIAL_STATE, error: validation.error });
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setState({ ...INITIAL_STATE, previewUrl: url });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleAnalyze = async () => {
    if (!file) return;
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    try {
      const result = await analyzeMedicineImage(file);
      setState((prev) => ({ ...prev, status: 'success', result }));
    } catch {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'حدث خطأ أثناء التحليل. يرجى المحاولة مرة أخرى.',
      }));
    }
  };

  const handleReset = () => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    setFile(null);
    setState(INITIAL_STATE);
  };

  const handleStartSearch = () => {
    if (state.result?.extractedMedicineName) {
      navigate(`${ROUTES.SEARCH_RESULTS}?q=${encodeURIComponent(state.result.extractedMedicineName)}`);
    }
  };

  const aiMode = getGeminiMode();
  void isGeminiConfigured();

  const modeLabel =
    aiMode === 'endpoint'
      ? { variant: 'info' as const, text: 'الذكاء الاصطناعي مفعّل عبر خادم آمن' }
      : aiMode === 'dev-key'
      ? { variant: 'warning' as const, text: 'الذكاء الاصطناعي مفعّل — وضع تطوير محلي (المفتاح مكشوف في الـ bundle، لا تنشر هكذا)' }
      : { variant: 'warning' as const, text: 'وضع تجريبي — أضف VITE_AI_API_ENDPOINT في .env للإنتاج' };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
          <Camera size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-text-main mb-3">تحليل صورة الدواء</h1>
        <p className="text-text-secondary max-w-lg mx-auto leading-relaxed">
          ارفع صورة واضحة لعبوة الدواء أو الوصفة الطبية، وسنحاول استخراج اسم الدواء
          والمعلومات الأساسية منها.
        </p>
      </div>

      <Alert variant={modeLabel.variant} className="mb-6">
        <p>
          <span className="font-semibold">حالة التحليل الذكي:</span> {modeLabel.text}
        </p>
      </Alert>

      {!state.previewUrl ? (
        <div
          className={`border-2 border-dashed rounded-card p-12 text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-primary bg-primary-light/30'
              : 'border-secondary bg-bg-surface hover:border-primary hover:bg-primary-light/10'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          aria-label="منطقة رفع الصور"
        >
          <Upload size={48} className="text-secondary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text-main mb-2">
            اسحب وأفلت الصورة هنا
          </p>
          <p className="text-text-secondary text-sm mb-4">أو اضغط لاختيار صورة</p>
          <div className="flex flex-wrap justify-center gap-2">
            {IMAGE_UPLOAD.ALLOWED_EXTENSIONS.map((ext) => (
              <span
                key={ext}
                className="px-3 py-1 bg-border-light text-text-secondary text-xs rounded-full"
              >
                {ext}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-3">
            الحد الأقصى لحجم الملف: {IMAGE_UPLOAD.MAX_SIZE_LABEL}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_UPLOAD.ALLOWED_TYPES.join(',')}
            onChange={handleFileInput}
            className="hidden"
            aria-label="اختر صورة"
          />
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-default rounded-card p-6 shadow-card">

          <div className="relative mb-5">
            <img
              src={state.previewUrl}
              alt="صورة الدواء المرفوعة"
              className="w-full max-h-64 object-contain rounded-card bg-bg-page"
            />
            <button
              onClick={handleReset}
              className="absolute top-3 end-3 w-8 h-8 rounded-full bg-white border border-border-default flex items-center justify-center hover:bg-danger-bg hover:text-danger-text transition-colors shadow"
              aria-label="إزالة الصورة"
            >
              <X size={16} />
            </button>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-4 p-3 bg-bg-page rounded-card">
              <ImageIcon size={16} />
              <span className="flex-1 truncate">{file.name}</span>
              <span>{(file.size / 1024).toFixed(0)} KB</span>
            </div>
          )}

          {state.status === 'idle' && (
            <Button
              onClick={handleAnalyze}
              size="lg"
              className="w-full"
              icon={<Search size={18} />}
            >
              تحليل الصورة
            </Button>
          )}

          {state.status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={36} className="text-primary animate-spin" />
              <p className="text-text-secondary text-sm">جارٍ تحليل الصورة...</p>
            </div>
          )}
        </div>
      )}

      {state.error && (
        <Alert variant="danger" className="mt-4" onClose={handleReset}>
          {state.error}
        </Alert>
      )}

      {state.status === 'success' && state.result && (
        <div className="mt-6 bg-primary-light/30 border border-primary/25 rounded-card p-6 shadow-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center">
              <Check size={16} className="text-success-text" />
            </div>
            <h2 className="font-bold text-text-main text-lg">نتائج التحليل</h2>
            <div className="mr-auto flex items-center gap-1.5 bg-bg-surface border border-border-default px-3 py-1 rounded-full">
              <span className="text-xs text-text-secondary">الثقة:</span>
              <span className="text-xs font-bold text-primary">
                {Math.round((state.result.confidence || 0) * 100)}%
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            {[
              { label: 'اسم الدواء المستخرج', value: state.result.extractedMedicineName },
              { label: 'المادة الفعالة', value: state.result.extractedActiveIngredient },
              { label: 'التركيز', value: state.result.extractedConcentration },
            ].map((item) => (
              <div key={item.label} className="bg-bg-surface rounded-card p-3 flex items-center justify-between gap-3">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className="text-sm font-bold text-text-main">
                  {item.value || <span className="text-text-secondary font-normal">غير محدد</span>}
                </span>
              </div>
            ))}
          </div>

          {state.result.notes && (
            <Alert variant="info" className="mb-4">
              <span className="text-sm">{state.result.notes}</span>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {state.result.extractedMedicineName && (
              <Button
                onClick={handleStartSearch}
                icon={<Search size={16} />}
                className="flex-1"
              >
                ابحث عن &quot;{state.result.extractedMedicineName}&quot;
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              تحليل صورة جديدة
            </Button>
          </div>
        </div>
      )}

      <Alert variant="warning" title="ملاحظة مهمة" className="mt-8">
        نتائج تحليل الصور أولية وقد تكون غير دقيقة. تحقق دائمًا من اسم الدواء مع
        الصيدلاني قبل اتخاذ أي قرار.
      </Alert>
    </div>
  );
}
