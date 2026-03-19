import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Camera, X, Check,
  Search, Loader2, Image as ImageIcon, RefreshCw,
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

type InputMode = 'upload' | 'camera';
type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'captured'
  | 'denied'
  | 'unavailable'
  | 'error';

export function ImageAnalysisPage() {
  const navigate = useNavigate();

  // وضع الإدخال: رفع ملف أو كاميرا
  const [inputMode, setInputMode] = useState<InputMode>('upload');

  // حالة رفع الملف
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImageAnalysisState>(INITIAL_STATE);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // حالة الكاميرا
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraError, setCameraError] = useState<string>('');
  // true بعد أن يبدأ تدفق الفيديو فعلياً (loadedmetadata)
  const [videoReady, setVideoReady] = useState(false);

  // إيقاف الكاميرا عند الخروج من الصفحة أو تغيير الوضع
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoReady(false);
    setCameraStatus('idle');
    setCameraError('');
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ---------------------------------------------------------------
  // FIX: Attach the media stream to the video element AFTER React
  // has rendered it into the DOM.  The <video> tag is conditionally
  // rendered only when cameraStatus === 'active', so videoRef.current
  // is null before that state change.  Waiting for the effect (which
  // runs after the DOM update) guarantees the ref is valid.
  // ---------------------------------------------------------------
  useEffect(() => {
    if (cameraStatus !== 'active') return;

    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;

    const tryPlay = () => {
      video.play().catch((e) => {
        // AbortError is common if the element is removed before play resolves
        if ((e as Error).name !== 'AbortError') {
          console.warn('[Camera] play() failed:', e);
        }
      });
    };

    // loadedmetadata fires once the browser knows video dimensions.
    // On mobile Safari, calling play() before this event causes a silent failure.
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      // Metadata already available (rare but possible on fast devices)
      tryPlay();
    } else {
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
    }

    // Mark video as ready so the capture button becomes active
    const handleCanPlay = () => setVideoReady(true);
    video.addEventListener('canplay', handleCanPlay, { once: true });

    return () => {
      video.removeEventListener('loadedmetadata', tryPlay);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [cameraStatus]);

  const handleSwitchMode = (mode: InputMode) => {
    if (mode !== inputMode) {
      stopCamera();
      setCameraStatus('idle');
      setCameraError('');
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      setFile(null);
      setState(INITIAL_STATE);
      setInputMode(mode);
    }
  };

  // ---- وضع رفع الملف ----
  const handleFile = useCallback((selectedFile: File) => {
    const validation = validateImageFile(selectedFile);
    if (!validation.valid) {
      setState({ ...INITIAL_STATE, error: validation.error });
      return;
    }
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setState({ ...INITIAL_STATE, previewUrl: url });
  }, [state.previewUrl]);

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

  // ---- وضع الكاميرا ----
  const startCamera = async () => {
    setCameraStatus('requesting');
    setCameraError('');
    setVideoReady(false);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('unavailable');
        setCameraError('الكاميرا غير مدعومة في هذا المتصفح أو الجهاز.');
        return;
      }

      let stream: MediaStream;
      try {
        // Use { ideal: 'environment' } so the browser prefers the back camera
        // but does NOT throw OverconstrainedError on desktop (unlike exact: 'environment').
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch {
        // Fallback: request any available camera without constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      // Set status to 'active' HERE — this triggers a React re-render that
      // mounts the <video> element into the DOM.  The useEffect above then
      // runs (after the DOM update) and safely assigns stream to srcObject.
      // Do NOT assign srcObject here; videoRef.current is still null at this point.
      setCameraStatus('active');
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setCameraError('تم رفض إذن الكاميرا. يرجى السماح بالوصول من إعدادات المتصفح ثم المحاولة مرة أخرى.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraStatus('unavailable');
        setCameraError('لا توجد كاميرا متاحة على هذا الجهاز.');
      } else {
        setCameraStatus('error');
        setCameraError('تعذّر فتح الكاميرا. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Guard: ensure the video is actually streaming frames.
    // videoWidth === 0 means no frame data yet → would produce a black image.
    if (!video.videoWidth || !video.videoHeight || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setCameraError('الكاميرا لم تجهز بعد. يرجى الانتظار لحظة والمحاولة مرة أخرى.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraStatus('error');
        setCameraError('تعذّر التقاط الصورة. يرجى المحاولة مرة أخرى.');
        return;
      }
      const capturedFile = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      setCameraStatus('captured');
      handleFile(capturedFile);
    }, 'image/jpeg', 0.92);
  };

  const retakePhoto = () => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    setFile(null);
    setState(INITIAL_STATE);
    setCameraStatus('idle');
    setCameraError('');
  };

  // ---- تحليل الصورة (مشترك) ----
  const handleAnalyze = async () => {
    if (!file) return;
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    try {
      const result = await analyzeMedicineImage(file);
      setState((prev) => ({ ...prev, status: 'success', result }));
    } catch (err) {
      console.error('[ImageAnalysisPage] analyze failed:', err);
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'تعذّر تحليل الصورة. يرجى المحاولة مرة أخرى.',
      }));
    }
  };

  const handleReset = () => {
    stopCamera();
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    setFile(null);
    setState(INITIAL_STATE);
    setCameraStatus('idle');
    setCameraError('');
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

  const hasImage = !!state.previewUrl;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
          <Camera size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-text-main mb-3">تحليل صورة الدواء</h1>
        <p className="text-text-secondary max-w-lg mx-auto leading-relaxed">
          ارفع صورة واضحة لعبوة الدواء أو التقطها بالكاميرا، وسنحاول استخراج اسم الدواء
          والمعلومات الأساسية منها.
        </p>
      </div>

      <Alert variant={modeLabel.variant} className="mb-6">
        <p>
          <span className="font-semibold">حالة التحليل الذكي:</span> {modeLabel.text}
        </p>
      </Alert>

      {/* تبديل وضع الإدخال */}
      {!hasImage && cameraStatus !== 'active' && (
        <div className="flex gap-2 mb-6 p-1 bg-bg-page rounded-card border border-border-default">
          <button
            onClick={() => handleSwitchMode('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-btn text-sm font-semibold transition-colors ${
              inputMode === 'upload'
                ? 'bg-primary text-white shadow'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Upload size={16} />
            رفع صورة
          </button>
          <button
            onClick={() => handleSwitchMode('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-btn text-sm font-semibold transition-colors ${
              inputMode === 'camera'
                ? 'bg-primary text-white shadow'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Camera size={16} />
            التقاط بالكاميرا
          </button>
        </div>
      )}

      {/* ====== وضع رفع الصورة ====== */}
      {inputMode === 'upload' && (
        <>
          {!hasImage ? (
            <div
              className={`border-2 border-dashed rounded-card p-12 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-primary bg-primary-light/30'
                  : 'border-secondary bg-bg-surface hover:border-primary hover:bg-primary-light/10'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              aria-label="منطقة رفع الصور"
            >
              <Upload size={48} className="text-secondary mx-auto mb-4" />
              <p className="text-lg font-semibold text-text-main mb-2">
                اسحب وأفلت الصورة هنا
              </p>
              <p className="text-text-secondary text-sm mb-4">أو اضغط لاختيار صورة من جهازك</p>
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
                  src={state.previewUrl!}
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
              {(state.status === 'idle' || state.status === 'error') && (
                <Button onClick={handleAnalyze} size="lg" className="w-full" icon={<Search size={18} />}>
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
        </>
      )}

      {/* ====== وضع الكاميرا ====== */}
      {inputMode === 'camera' && !hasImage && (
        <div className="bg-bg-surface border border-border-default rounded-card overflow-hidden shadow-card">

          {/* حالة: idle — لم تُفتح الكاميرا بعد */}
          {cameraStatus === 'idle' && (
            <div className="p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
                <Camera size={36} className="text-primary" />
              </div>
              <p className="text-text-main font-semibold mb-2">التقاط صورة بالكاميرا</p>
              <p className="text-text-secondary text-sm mb-6 max-w-xs mx-auto">
                سيتم طلب إذن الوصول إلى الكاميرا. وجّه الكاميرا نحو عبوة الدواء والتقط الصورة.
              </p>
              <Button onClick={startCamera} icon={<Camera size={18} />} size="lg">
                فتح الكاميرا
              </Button>
            </div>
          )}

          {/* حالة: جاري فتح الكاميرا */}
          {cameraStatus === 'requesting' && (
            <div className="p-10 text-center">
              <Loader2 size={36} className="text-primary animate-spin mx-auto mb-4" />
              <p className="text-text-secondary text-sm">جارٍ فتح الكاميرا...</p>
            </div>
          )}

          {/* حالة: الكاميرا نشطة — عرض البث المباشر */}
          {cameraStatus === 'active' && (
            <div>
              <div className="relative bg-black">
                {/*
                  autoPlay    — lets browser start playback without user gesture (required on most browsers)
                  playsInline — required on iOS Safari to prevent fullscreen takeover
                  muted       — required for autoplay policies in Chrome/Safari
                  The stream is attached via useEffect after this element mounts,
                  because videoRef.current is null until cameraStatus becomes 'active'.
                */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-80 object-contain"
                />
                {/* Show a subtle spinner overlay while stream is buffering */}
                {!videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={32} className="text-white/70 animate-spin" />
                  </div>
                )}
                <button
                  onClick={stopCamera}
                  className="absolute top-3 end-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  aria-label="إغلاق الكاميرا"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 text-center bg-bg-page">
                <p className="text-text-secondary text-xs mb-3">
                  وجّه الكاميرا نحو عبوة الدواء بوضوح، ثم اضغط لالتقاط الصورة
                </p>
                {cameraError && (
                  <p className="text-xs text-danger-text mb-2">{cameraError}</p>
                )}
                <Button
                  onClick={capturePhoto}
                  icon={<Camera size={18} />}
                  size="lg"
                  disabled={!videoReady}
                >
                  {videoReady ? 'التقاط الصورة' : 'جارٍ تحضير الكاميرا...'}
                </Button>
              </div>
            </div>
          )}

          {/* حالة: تم رفض الإذن */}
          {cameraStatus === 'denied' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-danger-bg flex items-center justify-center mx-auto mb-4">
                <Camera size={28} className="text-danger-text" />
              </div>
              <p className="font-semibold text-text-main mb-2">تم رفض إذن الكاميرا</p>
              <p className="text-text-secondary text-sm mb-5 max-w-sm mx-auto">{cameraError}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => setCameraStatus('idle')} icon={<RefreshCw size={16} />}>
                  أعد المحاولة
                </Button>
                <Button variant="outline" onClick={() => handleSwitchMode('upload')} icon={<Upload size={16} />}>
                  ارفع صورة بدلًا من ذلك
                </Button>
              </div>
            </div>
          )}

          {/* حالة: لا توجد كاميرا */}
          {cameraStatus === 'unavailable' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-warning-bg flex items-center justify-center mx-auto mb-4">
                <Camera size={28} className="text-warning-text" />
              </div>
              <p className="font-semibold text-text-main mb-2">لا توجد كاميرا متاحة</p>
              <p className="text-text-secondary text-sm mb-5 max-w-sm mx-auto">{cameraError}</p>
              <Button variant="outline" onClick={() => handleSwitchMode('upload')} icon={<Upload size={16} />}>
                ارفع صورة من الجهاز
              </Button>
            </div>
          )}

          {/* حالة: خطأ عام */}
          {cameraStatus === 'error' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-danger-bg flex items-center justify-center mx-auto mb-4">
                <Camera size={28} className="text-danger-text" />
              </div>
              <p className="font-semibold text-text-main mb-2">تعذّر فتح الكاميرا</p>
              <p className="text-text-secondary text-sm mb-5 max-w-sm mx-auto">{cameraError}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={startCamera} icon={<RefreshCw size={16} />}>
                  أعد المحاولة
                </Button>
                <Button variant="outline" onClick={() => handleSwitchMode('upload')} icon={<Upload size={16} />}>
                  ارفع صورة بدلًا من ذلك
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* canvas مخفي لالتقاط الصورة من الكاميرا */}
      <canvas ref={canvasRef} className="hidden" />

      {/* عرض الصورة الملتقطة بالكاميرا (قبل التحليل) */}
      {inputMode === 'camera' && hasImage && (
        <div className="bg-bg-surface border border-border-default rounded-card p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center">
              <Camera size={13} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-text-main">الصورة الملتقطة</p>
          </div>
          <div className="relative mb-5">
            <img
              src={state.previewUrl!}
              alt="الصورة الملتقطة بالكاميرا"
              className="w-full max-h-64 object-contain rounded-card bg-bg-page"
            />
            <button
              onClick={retakePhoto}
              className="absolute top-3 end-3 w-8 h-8 rounded-full bg-white border border-border-default flex items-center justify-center hover:bg-danger-bg hover:text-danger-text transition-colors shadow"
              aria-label="التقط صورة أخرى"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            {(state.status === 'idle' || state.status === 'error') && (
              <>
                <Button onClick={handleAnalyze} size="lg" className="flex-1" icon={<Search size={18} />}>
                  تحليل الصورة
                </Button>
                <Button variant="outline" onClick={retakePhoto} icon={<RefreshCw size={16} />}>
                  التقاط صورة أخرى
                </Button>
              </>
            )}
            {state.status === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-4 w-full">
                <Loader2 size={36} className="text-primary animate-spin" />
                <p className="text-text-secondary text-sm">جارٍ تحليل الصورة...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* رسالة الخطأ */}
      {state.error && (
        <Alert variant="danger" className="mt-4" onClose={handleReset}>
          {state.error}
        </Alert>
      )}

      {/* نتائج التحليل */}
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
            <Button variant="outline" onClick={handleReset} className="flex-1">
              {inputMode === 'camera' ? 'التقاط صورة جديدة' : 'تحليل صورة جديدة'}
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
