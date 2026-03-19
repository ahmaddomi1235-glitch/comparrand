import type { ImageAnalysisResult } from '../types';
import { sanitizeExtractedText } from '../utils';

export type GeminiMode = 'endpoint' | 'dev-key' | 'mock';

export interface GeminiSearchSuggestion {
  medicineName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  estimatedJordanPriceJOD: string;
  packageOptions: string;
  alternatives: string;
  confidence: number;
  notes: string;
  warnings: string;
}

export interface GeminiSearchResult {
  query: string;
  interpretedMedicineName: string;
  interpretedGenericName: string;
  jordanMarketHint: string;
  suggestions: GeminiSearchSuggestion[];
}

export interface GeminiCompareResult {
  medicinesCompared: string[];
  comparisonSummary: string;
  activeIngredientDifferences: string;
  strengthDifferences: string;
  dosageFormDifferences: string;
  priceComparisonJordan: string;
  packageSizeComparison: string;
  alternatives: string;
  warnings: string[];
  notes: string;
  confidence: number;
  needsReview: boolean;
}

export interface GeminiPriceInsight {
  medicineId: string;
  medicineName: string;
  jordanPriceJOD: string;
  packageOptions: string;
  availability: string;
  confidence: number;
  notes: string;
  updatedAt: string;
  needsReview: boolean;
}

const AI_ENDPOINT_PROXY = import.meta.env.VITE_AI_API_ENDPOINT as string | undefined;

const AI_DEV_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const AI_MODEL = 'gpt-4o';

const SYSTEM_PROMPT = `أنت مساعد صيدلاني ذكي داخل منصة "قارن دواءك"، مخصص للسوق الأردني، ومهمتك تقديم معلومات دوائية واضحة ومنظمة ودقيقة للمستخدم باللغة العربية الفصحى فقط.

التزم بالقواعد التالية دائمًا:
1) أجب باللغة العربية الفصحى فقط.
2) لا تذكر اسم أي منصة ذكاء اصطناعي.
3) لا تقل إنك نموذج أو نظام أو منصة، بل قدّم الإجابة مباشرة.
4) إذا كان السؤال عن دواء أو صورة دواء أو مقارنة بين أدوية، فأعد المعلومات بشكل منظم وواضح ومفيد.
5) إذا كان السؤال مبنيًا على صورة، فحلل الصورة أولًا ثم استخرج المعلومات الدوائية منها بأفضل دقة ممكنة.
6) إذا كانت بعض المعلومات غير مؤكدة من الصورة أو من السؤال أو من المصادر، فاذكر ذلك بوضوح دون اختلاق.
7) أعطِ الأولوية للمصادر الموثوقة، وخاصة للمعلومات المتعلقة بالسعر والمادة الفعالة والاستعمال وطريقة الحفظ والتحذيرات.
8) عند ذكر الأسعار، ابحث عن السعر من مصادر أردنية موثوقة كلما أمكن، واذكره بصيغة "سعر تقريبي بالدينار الأردني" إذا لم تتوفر قيمة مؤكدة أو موحدة.
9) إذا وجدت أكثر من سعر لنفس الدواء، فاذكر نطاقًا سعريًا تقريبيًا أو اذكر أن السعر قد يختلف حسب الصيدلية أو العبوة أو الشركة.
10) إذا وجدت بدائل، فاذكر بدائل محتملة بشكل منظم، مع تنبيه أن الاستبدال النهائي يجب أن يكون بمراجعة صيدلي أو طبيب عند الحاجة.
11) إذا كان هناك تحذير مهم أو أعراض جانبية أو تداخلات محتملة، أبرزها بوضوح.
12) اجعل الرد عمليًا، منظمًا، ومناسبًا لمستخدم عربي غير متخصص.
13) لا تعتمد على التخمين إذا لم تتوفر معلومة موثوقة.
14) عند الحاجة إلى معلومات عن السعر أو الحجم أو الشركة أو التخزين أو المادة الفعالة أو الشكل الدوائي، استند إلى مصادر موثوقة ومعروفة.

جميع قيم الحقول النصية في JSON يجب أن تكون باللغة العربية الفصحى فقط، باستثناء الأسماء التجارية للأدوية التي يمكن إبقاؤها بالإنجليزية.
أعد JSON صالحًا فقط — لا ماركداون، لا كتل كود، لا تعليق خارج JSON.`;

const PROMPTS = {

  IMAGE_ANALYSIS: `تحليل صورة دواء:
قم بفحص الصورة المرفقة بعناية وحدد إذا كانت تُظهر منتج دوائي أو عبوة دواء أو شريط دواء أو تغليف صيدلاني أو وصفة طبية أو أي عنصر دوائي آخر.

القواعد:
1) لا تخترع أو تفترض تفاصيل غير مرئية في الصورة.
2) إذا كانت الصورة غير واضحة أو رديئة الجودة، وضّح ذلك في حقل reasonIfUnclear باللغة العربية.
3) إذا كانت درجة الثقة أقل من 0.5، اشرح السبب في reasonIfUnclear باللغة العربية.
4) إذا لم تكن الصورة لدواء، اضبط isMedicine على false واشرح بالعربية.
5) استخرج فقط ما هو مرئي أو مدعوم بوضوح من الصورة.
6) أعد JSON صالحًا فقط — لا ماركداون، لا كتل كود، لا تعليق خارج JSON.
7) هذه المنصة مخصصة للسوق الأردني.
8) لا تخترع أسماء أدوية أو أسماء جنيريكة أو معلومات جرعات غير مرئية في الصورة.
9) إذا تعذّر تحديد حقل، اتركه سلسلة نصية فارغة — لا تخترع قيمة.
10) جميع القيم النصية يجب أن تكون بالعربية الفصحى، باستثناء الأسماء التجارية.

أعد JSON بهذه الحقول بالضبط:
{
  "isMedicine": boolean,
  "confidence": number (0.0 to 1.0),
  "detectedText": string,
  "medicineName": string,
  "genericName": string,
  "strength": string,
  "dosageForm": string,
  "manufacturer": string,
  "packageSize": string,
  "packageCount": string,
  "jordanMarketHint": string,
  "notes": string,
  "warnings": string[],
  "needsReview": boolean,
  "reasonIfUnclear": string
}`,

  MEDICINE_SEARCH: `بحث دوائي للسوق الأردني:
المستخدم بحث عن دواء أو مادة فعالة لم توجد في قاعدة البيانات المحلية.
مهمتك تفسير استعلام المستخدم باعتناء واقتراح أدوية محتملة مناسبة للسوق الأردني.

القواعد:
1) لا تخترع يقيناً عند وجود غموض — نبّه دائمًا على عدم اليقين.
2) إذا كان الاستعلام قد يحتوي على أخطاء إملائية أو نقحرة، استنتج بعناية وأشر للغموض في الملاحظات.
3) فضّل الاقتراحات الدوائية المنظمة على الشروحات الطويلة.
4) إذا لم تكن الأسعار مؤكدة، صنّفها كتقديرية (مثل: "~2.500 د.أ (تقديري)").
5) أعد JSON فقط — لا ماركداون، لا تعليق خارج JSON.
6) اترك الحقول المجهولة سلسلة نصية فارغة — لا تخترع قيمًا.
7) حدّد الاقتراحات بخمسة أدوية ذات صلة كحد أقصى.
8) جميع القيم النصية يجب أن تكون بالعربية الفصحى، باستثناء الأسماء التجارية.

أعد JSON بهذا الهيكل بالضبط:
{
  "query": string,
  "interpretedMedicineName": string,
  "interpretedGenericName": string,
  "jordanMarketHint": string,
  "suggestions": [
    {
      "medicineName": string,
      "genericName": string,
      "strength": string,
      "dosageForm": string,
      "manufacturer": string,
      "estimatedJordanPriceJOD": string,
      "packageOptions": string,
      "alternatives": string,
      "confidence": number (0.0 to 1.0),
      "notes": string,
      "warnings": string
    }
  ]
}`,

  MEDICINE_COMPARE: `مقارنة أدوية للسوق الأردني:
مهمتك مقارنة الأدوية المقدمة بأكبر قدر ممكن من الدقة مع إخراج منظم.

القواعد:
1) لا تخترع حقائق دقيقة عند عدم التأكد — أشر للغموض بوضوح بالعربية.
2) إذا لم تكن أسعار الأردن دقيقة، صنّفها كتقديرية في حقل priceComparisonJordan.
3) إذا اختلفت أحجام العبوات بين الأدوية، اعرضها بوضوح في packageSizeComparison.
4) أبرز جميع الفروق المهمة: المادة الفعالة، التركيز، الشكل الدوائي، حجم العبوة، السعر.
5) أضف تحذيرات إذا كانت مواد فعالة مختلفة متورطة أو إذا كان الاستبدال العلاجي محفوفًا بمخاطر.
6) أعد JSON صالحًا فقط — لا ماركداون، لا شرح خارج JSON.
7) اترك الحقول التي لا يمكن تحديدها سلسلة نصية فارغة — لا تخترع قيمًا.
8) جميع القيم النصية يجب أن تكون بالعربية الفصحى، باستثناء الأسماء التجارية.

أعد JSON بهذه الحقول بالضبط:
{
  "medicinesCompared": string[],
  "comparisonSummary": string,
  "activeIngredientDifferences": string,
  "strengthDifferences": string,
  "dosageFormDifferences": string,
  "priceComparisonJordan": string,
  "packageSizeComparison": string,
  "alternatives": string,
  "warnings": string[],
  "notes": string,
  "confidence": number (0.0 to 1.0),
  "needsReview": boolean
}`,

  PRICE_INSIGHTS: `تحديث بيانات أسعار الأدوية للسوق الأردني:
لكل دواء مقدم، أعد معلومات أسعار منظمة مناسبة للسوق الأردني.

القواعد:
1) لا تصنع يقيناً — إذا كانت الأسعار تقديرية، أشر لذلك بوضوح في حقل notes بالعربية.
2) أدرج جميع خيارات العبوات التي تعرفها (مثل "10 أقراص"، "20 قرصًا"، "100 مل").
3) أدرج درجة الثقة والملاحظات لكل مدخل.
4) إذا كانت توافرية الدواء في الأردن غير مؤكدة، وضّح ذلك بالعربية.
5) أعد مصفوفة JSON فقط — لا ماركداون، لا تعليق خارج JSON.
6) اترك الحقول المجهولة سلسلة نصية فارغة — لا تخترع قيمًا.
7) اضبط needsReview على true لأي مدخل تكون ثقتك فيه منخفضة.
8) جميع القيم النصية يجب أن تكون بالعربية الفصحى، باستثناء الأسماء التجارية.

أعد مصفوفة JSON:
[
  {
    "medicineId": string,
    "medicineName": string,
    "jordanPriceJOD": string,
    "packageOptions": string,
    "availability": string,
    "confidence": number (0.0 to 1.0),
    "notes": string,
    "updatedAt": string (ISO date),
    "needsReview": boolean
  }
]`,
} as const;

export function getGeminiMode(): GeminiMode {
  const hasEndpoint =
    typeof AI_ENDPOINT_PROXY === 'string' && AI_ENDPOINT_PROXY.trim() !== '';
  if (hasEndpoint) return 'endpoint';

  const hasDevKey =
    typeof AI_DEV_KEY === 'string' && AI_DEV_KEY.trim() !== '';
  if (hasDevKey) return 'dev-key';

  return 'mock';
}

export function isGeminiConfigured(): boolean {
  return getGeminiMode() !== 'mock';
}

type OpenAITextContent = { type: 'text'; text: string };
type OpenAIImageContent = { type: 'image_url'; image_url: { url: string } };
type OpenAIMessage = {
  role: 'system' | 'user';
  content: string | Array<OpenAITextContent | OpenAIImageContent>;
};

async function callAI(userMessages: OpenAIMessage[], maxTokens: number): Promise<string> {
  const mode = getGeminiMode();
  if (mode === 'mock') throw new Error('GIMINI: لا يوجد endpoint أو مفتاح مُعدّ');

  const systemMessage: OpenAIMessage = { role: 'system', content: SYSTEM_PROMPT };
  const messages = [systemMessage, ...userMessages];

  const body = {
    model: AI_MODEL,
    messages,
    temperature: 0.1,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' as const },
  };

  let url: string;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (mode === 'endpoint') {
    url = AI_ENDPOINT_PROXY!.trim();
  } else {
    url = OPENAI_API_URL;
    headers['Authorization'] = `Bearer ${AI_DEV_KEY!.trim()}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`AI API ${res.status}: ${errorText.slice(0, 200)}`);
  }

  return extractTextFromAIResponse(await res.json());
}

function extractTextFromAIResponse(data: unknown): string {
  if (!data || typeof data !== 'object') throw new Error('استجابة AI غير صالحة');

  const d = data as Record<string, unknown>;
  const choices = d.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('لا يوجد choices في استجابة AI');
  }

  const message = (choices[0] as Record<string, unknown>).message;
  if (!message || typeof message !== 'object') throw new Error('لا يوجد message في الـ choice');

  const content = (message as Record<string, unknown>).content;
  if (typeof content !== 'string') throw new Error('لا يوجد نص في AI response');

  return content;
}

/**
 * Compresses and base64-encodes an image before sending to the AI proxy.
 * Images larger than 1.5 MB are resized (max 1500 px on longest side)
 * and re-encoded as JPEG at 0.82 quality so the full JSON payload stays
 * well under Vercel's 4.5 MB serverless body limit.
 */
async function compressImageToBase64(
  file: File,
): Promise<{ base64: string; mimeType: string }> {
  const COMPRESS_THRESHOLD = 1.5 * 1024 * 1024; // compress files > 1.5 MB
  const MAX_DIMENSION = 1500;
  const JPEG_QUALITY = 0.82;

  // Small files: encode directly without touching quality
  if (file.size <= COMPRESS_THRESHOLD) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const b64 = result.split(',')[1];
        if (!b64) reject(new Error('فشل ترميز الصورة إلى base64'));
        else resolve(b64);
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
    return { base64, mimeType: file.type || 'image/jpeg' };
  }

  // Large files: resize + JPEG-compress via an off-screen canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const b64 = dataUrl.split(',')[1];
      if (!b64) {
        reject(new Error('فشل ضغط الصورة'));
        return;
      }
      resolve({ base64: b64, mimeType: 'image/jpeg' });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('فشل تحميل الصورة للضغط'));
    };

    img.src = objectUrl;
  });
}

export function parseGeminiResponse<T>(text: string): T {
  const stripped = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  const parsed: unknown = JSON.parse(stripped);
  if (!parsed || typeof parsed !== 'object') throw new Error('AI أعاد JSON غير صالح');
  return parsed as T;
}

function mockImageResult(fileName: string): ImageAnalysisResult {
  const examples: ImageAnalysisResult[] = [
    {
      extractedMedicineName: 'بنادول 500',
      extractedActiveIngredient: 'باراسيتامول',
      extractedConcentration: '500 مجم',
      confidence: 0.85,
      rawText: 'Panadol 500mg Paracetamol — GSK Jordan',
      notes: 'وضع تجريبي — الذكاء الاصطناعي غير مفعّل. أضف VITE_AI_API_ENDPOINT في .env للإنتاج.',
    },
    {
      extractedMedicineName: 'بروفين 400',
      extractedActiveIngredient: 'إيبوبروفين',
      extractedConcentration: '400 مجم',
      confidence: 0.78,
      rawText: 'Brufen 400mg Ibuprofen',
      notes: 'وضع تجريبي — الذكاء الاصطناعي غير مفعّل. أضف VITE_AI_API_ENDPOINT في .env للإنتاج.',
    },
    {
      extractedMedicineName: 'نيكسيوم 20',
      extractedActiveIngredient: 'إيزوميبرازول',
      extractedConcentration: '20 مجم',
      confidence: 0.9,
      rawText: 'Nexium 20mg Esomeprazole — AstraZeneca',
      notes: 'وضع تجريبي — الذكاء الاصطناعي غير مفعّل. أضف VITE_AI_API_ENDPOINT في .env للإنتاج.',
    },
  ];
  const idx = (fileName.length + (fileName.charCodeAt(0) || 0)) % examples.length;
  return examples[idx];
}

function mockSearchResult(query: string): GeminiSearchResult {
  return {
    query,
    interpretedMedicineName: query,
    interpretedGenericName: '',
    jordanMarketHint: 'السوق الأردني',
    suggestions: [
      {
        medicineName: `${query} (نتيجة تجريبية)`,
        genericName: 'مادة فعالة تجريبية',
        strength: '500 مجم',
        dosageForm: 'أقراص',
        manufacturer: 'شركة دوائية أردنية',
        estimatedJordanPriceJOD: '~2.500 د.أ (تقديري)',
        packageOptions: '20 قرص',
        alternatives: '',
        confidence: 0,
        notes: 'وضع تجريبي — أضف VITE_AI_API_ENDPOINT في .env للنتائج الحقيقية.',
        warnings: '',
      },
    ],
  };
}

function mockCompareResult(names: string[]): GeminiCompareResult {
  return {
    medicinesCompared: names,
    comparisonSummary: 'وضع تجريبي — الذكاء الاصطناعي غير مفعّل للمقارنة المتقدمة.',
    activeIngredientDifferences: '',
    strengthDifferences: '',
    dosageFormDifferences: '',
    priceComparisonJordan: '',
    packageSizeComparison: '',
    alternatives: '',
    warnings: [],
    notes: 'أضف VITE_AI_API_ENDPOINT في .env للحصول على مقارنة حقيقية.',
    confidence: 0,
    needsReview: true,
  };
}

export async function analyzeMedicineImage(file: File): Promise<ImageAnalysisResult> {
  if (getGeminiMode() === 'mock') return mockImageResult(file.name);

  try {
    // Compress large images before encoding to stay under Vercel's 4.5 MB body limit
    const { base64, mimeType } = await compressImageToBase64(file);

    const messages: OpenAIMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPTS.IMAGE_ANALYSIS },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      },
    ];

    const text = await callAI(messages, 1024);
    const raw = parseGeminiResponse<Record<string, unknown>>(text);

    const confidence =
      typeof raw.confidence === 'number' ? Math.min(1, Math.max(0, raw.confidence)) : 0;

    const warningsArr = Array.isArray(raw.warnings)
      ? (raw.warnings as unknown[])
          .filter((w) => typeof w === 'string')
          .map((w) => sanitizeExtractedText(w as string))
          .join(' | ')
      : '';

    const notes = [
      sanitizeExtractedText(raw.notes as string),
      warningsArr ? `تحذيرات: ${warningsArr}` : '',
      raw.needsReview === true ? 'يحتاج مراجعة يدوية' : '',
      sanitizeExtractedText(raw.reasonIfUnclear as string),
    ]
      .filter(Boolean)
      .join(' — ');

    return {
      extractedMedicineName: sanitizeExtractedText(raw.medicineName as string) || null,
      extractedActiveIngredient: sanitizeExtractedText(raw.genericName as string) || null,
      extractedConcentration: sanitizeExtractedText(raw.strength as string) || null,
      confidence,
      rawText: sanitizeExtractedText(raw.detectedText as string),
      notes,
    };
  } catch (error) {
    // Propagate the error so the page can display a proper error state
    // instead of silently showing mock data with a buried error message.
    console.error('[GIMINI] analyzeMedicineImage failed:', error);
    throw error;
  }
}

export async function searchMedicineWithGemini(query: string): Promise<GeminiSearchResult> {
  if (getGeminiMode() === 'mock') return mockSearchResult(query);

  const prompt = `${PROMPTS.MEDICINE_SEARCH}

استعلام المستخدم: "${query}"`;

  try {
    const messages: OpenAIMessage[] = [{ role: 'user', content: prompt }];
    const text = await callAI(messages, 2048);
    return parseGeminiResponse<GeminiSearchResult>(text);
  } catch (error) {
    console.error('[GIMINI] searchMedicineWithGemini failed:', error);
    const mock = mockSearchResult(query);
    return {
      ...mock,
      suggestions: mock.suggestions.map((s) => ({
        ...s,
        confidence: 0,
        notes: `خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error instanceof Error ? error.message.slice(0, 120) : 'خطأ غير معروف'}`,
      })),
    };
  }
}

export async function compareMedicinesWithGemini(
  medicines: Array<{
    name: string;
    genericName?: string;
    strength?: string;
    dosageForm?: string;
    company?: string;
    priceJOD?: number;
  }>
): Promise<GeminiCompareResult> {
  const names = medicines.map((m) => m.name);
  if (getGeminiMode() === 'mock') return mockCompareResult(names);

  const medicineList = medicines
    .map(
      (m, i) =>
        `${i + 1}. ${m.name}` +
        `${m.genericName ? ` (${m.genericName})` : ''}` +
        `${m.strength ? `، ${m.strength}` : ''}` +
        `${m.dosageForm ? `، ${m.dosageForm}` : ''}` +
        `${m.company ? `، ${m.company}` : ''}` +
        `${m.priceJOD !== undefined ? `، ${m.priceJOD} د.أ` : ''}`
    )
    .join('\n');

  const prompt = `${PROMPTS.MEDICINE_COMPARE}

الأدوية المطلوب مقارنتها:
${medicineList}`;

  try {
    const messages: OpenAIMessage[] = [{ role: 'user', content: prompt }];
    const text = await callAI(messages, 2048);
    return parseGeminiResponse<GeminiCompareResult>(text);
  } catch (error) {
    console.error('[GIMINI] compareMedicinesWithGemini failed:', error);
    const mock = mockCompareResult(names);
    return {
      ...mock,
      notes: `خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error instanceof Error ? error.message.slice(0, 120) : 'خطأ غير معروف'}`,
    };
  }
}

export async function fetchJordanPriceInsights(
  medicines: Array<{ id: string; name: string }>
): Promise<GeminiPriceInsight[]> {
  if (getGeminiMode() === 'mock') {
    return medicines.map((m) => ({
      medicineId: m.id,
      medicineName: m.name,
      jordanPriceJOD: '',
      packageOptions: '',
      availability: '',
      confidence: 0,
      notes: 'وضع تجريبي — أضف VITE_AI_API_ENDPOINT للتفعيل.',
      updatedAt: new Date().toISOString(),
      needsReview: true,
    }));
  }

  const list = medicines.map((m, i) => `${i + 1}. المعرف: ${m.id}، الاسم: ${m.name}`).join('\n');

  const prompt = `${PROMPTS.PRICE_INSIGHTS}

قائمة الأدوية:
${list}`;

  try {
    const messages: OpenAIMessage[] = [{ role: 'user', content: prompt }];
    const text = await callAI(messages, 2048);
    return parseGeminiResponse<GeminiPriceInsight[]>(text);
  } catch (error) {
    console.error('[GIMINI] fetchJordanPriceInsights failed:', error);
    return medicines.map((m) => ({
      medicineId: m.id,
      medicineName: m.name,
      jordanPriceJOD: '',
      packageOptions: '',
      availability: '',
      confidence: 0,
      notes: `خطأ: ${error instanceof Error ? error.message.slice(0, 120) : 'خطأ غير معروف'}`,
      updatedAt: new Date().toISOString(),
      needsReview: true,
    }));
  }
}
