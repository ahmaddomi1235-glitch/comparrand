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

const GEMINI_ENDPOINT_PROXY = import.meta.env.VITE_GEMINI_API_ENDPOINT as string | undefined;

const GEMINI_DEV_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const GEMINI_DIRECT_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

const PROMPTS = {

  IMAGE_ANALYSIS: `You are analyzing an uploaded medicine-related image for a pharmacy comparison platform focused on the Jordanian market.

Your task is to inspect the image carefully and determine whether it shows a medicine product, medicine box, blister pack, pharmaceutical packaging, prescription label, or another medicine-related item.

Rules:
1. Do not invent or assume details that are not visible in the image.
2. If the image is unclear or low quality, explicitly say so in reasonIfUnclear.
3. If confidence is below 0.5, explain why in reasonIfUnclear.
4. If this is not a medicine image, set isMedicine to false and explain clearly.
5. Extract only what is visible or strongly supported by the image.
6. Return valid JSON only — no markdown, no code fences, no extra commentary.
7. This platform is focused on Jordan. Do not assume legal approval or exact availability unless supported by visible evidence on the image.
8. Do not fabricate medicine names, generic names, or dosage information not visible on the image.
9. If a field cannot be determined, use an empty string — never invent a value.

Return JSON with exactly these fields:
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

  MEDICINE_SEARCH: `You are assisting a Jordan-focused pharmacy comparison platform.

A user searched for a medicine or active ingredient that was not found in the local dataset.
Your task is to interpret the user query carefully and suggest likely medicine matches relevant to the Jordanian market.

Rules:
1. Do not invent certainty where there is ambiguity — always flag uncertainty.
2. If the query may contain spelling mistakes or transliterations, infer carefully and mention uncertainty in the notes.
3. Prefer structured medicine suggestions over long text explanations.
4. If prices are not certain, label them as estimated (e.g., "~2.500 JOD (estimated)").
5. Return JSON only — no markdown, no extra commentary outside JSON.
6. Keep unknown fields as empty string — never invent values.
7. Limit suggestions to a maximum of 5 relevant medicines.

Return JSON with this exact structure:
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

  MEDICINE_COMPARE: `You are comparing medicines for a pharmacy comparison platform focused on Jordan.

Your task is to compare the provided medicines as accurately as possible using structured output.

Rules:
1. Do not invent exact facts if uncertain — flag uncertainty clearly.
2. If Jordan prices are not exact, mark them as estimated in priceComparisonJordan.
3. If package sizes vary between medicines, present them clearly in packageSizeComparison.
4. Highlight all important differences: active ingredient, strength, dosage form, package size, and price.
5. Include warnings if different active ingredients are involved or if therapeutic substitution is risky.
6. Return valid JSON only — no markdown, no extra explanation outside JSON.
7. Keep empty string for fields you cannot determine — never invent values.

Return JSON with exactly these fields:
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

  PRICE_INSIGHTS: `You are updating medicine pricing insights for a Jordan-focused pharmacy comparison platform.

For each medicine provided, return structured pricing information relevant to the Jordanian market.

Rules:
1. Do not fabricate certainty — if pricing is estimated, mark it clearly in the notes field.
2. Include all package options you are aware of (e.g., "10 tabs", "20 tabs", "100ml").
3. Include a confidence score and notes for each entry.
4. If availability in Jordan is uncertain, state that clearly.
5. Return JSON array only — no markdown, no extra commentary outside JSON.
6. Keep unknown fields as empty string — never invent values.
7. Set needsReview to true for any entry where you have low confidence.

Return JSON array:
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
    typeof GEMINI_ENDPOINT_PROXY === 'string' && GEMINI_ENDPOINT_PROXY.trim() !== '';
  if (hasEndpoint) return 'endpoint';

  const hasDevKey =
    typeof GEMINI_DEV_KEY === 'string' && GEMINI_DEV_KEY.trim() !== '';
  if (hasDevKey) return 'dev-key';

  return 'mock';
}

export function isGeminiConfigured(): boolean {
  return getGeminiMode() !== 'mock';
}

function buildRequestUrl(): string {
  const mode = getGeminiMode();
  if (mode === 'endpoint') return GEMINI_ENDPOINT_PROXY!.trim();
  if (mode === 'dev-key') {
    return `${GEMINI_DIRECT_URL}?key=${encodeURIComponent(GEMINI_DEV_KEY!.trim())}`;
  }
  throw new Error('GIMINI: لا يوجد endpoint أو مفتاح Gemini مُعدّ');
}

async function callGeminiText(prompt: string): Promise<string> {
  const url = buildRequestUrl();
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${errorText.slice(0, 200)}`);
  }

  return extractTextFromGeminiEnvelope(await res.json());
}

async function callGeminiWithImage(file: File, prompt: string): Promise<string> {
  const url = buildRequestUrl();
  const base64 = await fileToBase64(file);

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: file.type, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${errorText.slice(0, 200)}`);
  }

  return extractTextFromGeminiEnvelope(await res.json());
}

function extractTextFromGeminiEnvelope(data: unknown): string {
  if (!data || typeof data !== 'object') throw new Error('استجابة Gemini غير صالحة');

  const d = data as Record<string, unknown>;
  const candidates = d.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('لا يوجد candidates في استجابة Gemini');
  }

  const content = (candidates[0] as Record<string, unknown>).content;
  if (!content || typeof content !== 'object') throw new Error('لا يوجد content في الـ candidate');

  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts) || parts.length === 0) throw new Error('لا يوجد parts في الـ content');

  const text = (parts[0] as Record<string, unknown>).text;
  if (typeof text !== 'string') throw new Error('لا يوجد نص في Gemini part');

  return text;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
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
}

export function parseGeminiResponse<T>(text: string): T {
  const stripped = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  const parsed: unknown = JSON.parse(stripped);
  if (!parsed || typeof parsed !== 'object') throw new Error('Gemini أعاد JSON غير صالح');
  return parsed as T;
}

// ============================================================
// Mock fallbacks — عند غياب أي إعداد
// ============================================================

function mockImageResult(fileName: string): ImageAnalysisResult {
  const examples: ImageAnalysisResult[] = [
    {
      extractedMedicineName: 'بنادول 500',
      extractedActiveIngredient: 'باراسيتامول',
      extractedConcentration: '500 مجم',
      confidence: 0.85,
      rawText: 'Panadol 500mg Paracetamol — GSK Jordan',
      notes: 'وضع تجريبي — Gemini غير مفعّل. أضف VITE_GEMINI_API_ENDPOINT في .env للإنتاج، أو VITE_GEMINI_API_KEY للتطوير المحلي.',
    },
    {
      extractedMedicineName: 'بروفين 400',
      extractedActiveIngredient: 'إيبوبروفين',
      extractedConcentration: '400 مجم',
      confidence: 0.78,
      rawText: 'Brufen 400mg Ibuprofen',
      notes: 'وضع تجريبي — Gemini غير مفعّل. أضف VITE_GEMINI_API_ENDPOINT في .env للإنتاج، أو VITE_GEMINI_API_KEY للتطوير المحلي.',
    },
    {
      extractedMedicineName: 'نيكسيوم 20',
      extractedActiveIngredient: 'إيزوميبرازول',
      extractedConcentration: '20 مجم',
      confidence: 0.9,
      rawText: 'Nexium 20mg Esomeprazole — AstraZeneca',
      notes: 'وضع تجريبي — Gemini غير مفعّل. أضف VITE_GEMINI_API_ENDPOINT في .env للإنتاج، أو VITE_GEMINI_API_KEY للتطوير المحلي.',
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
        notes: 'وضع تجريبي — أضف VITE_GEMINI_API_ENDPOINT في .env للنتائج الحقيقية.',
        warnings: '',
      },
    ],
  };
}

function mockCompareResult(names: string[]): GeminiCompareResult {
  return {
    medicinesCompared: names,
    comparisonSummary: 'وضع تجريبي — Gemini غير مفعّل للمقارنة المتقدمة.',
    activeIngredientDifferences: '',
    strengthDifferences: '',
    dosageFormDifferences: '',
    priceComparisonJordan: '',
    packageSizeComparison: '',
    alternatives: '',
    warnings: [],
    notes: 'أضف VITE_GEMINI_API_ENDPOINT في .env للحصول على مقارنة حقيقية.',
    confidence: 0,
    needsReview: true,
  };
}

// ============================================================
// Public API — الدوال المصدّرة
// ============================================================

/**
 * تحليل صورة دواء باستخدام Gemini
 *
 * يُستخدم في: ImageAnalysisPage
 */
export async function analyzeMedicineImage(file: File): Promise<ImageAnalysisResult> {
  if (getGeminiMode() === 'mock') return mockImageResult(file.name);

  try {
    const text = await callGeminiWithImage(file, PROMPTS.IMAGE_ANALYSIS);
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
    console.error('[GIMINI] analyzeMedicineImage failed:', error);
    const mock = mockImageResult(file.name);
    return {
      ...mock,
      notes: `خطأ أثناء الاتصال بـ Gemini: ${error instanceof Error ? error.message.slice(0, 120) : 'خطأ غير معروف'}`,
      confidence: 0,
    };
  }
}

/**
 * البحث عن دواء غير موجود محليًا باستخدام Gemini
 *
 * يُستخدم في: SearchPage, SearchResultsPage, HomePage — زر "لم أجد دوائي"
 */
export async function searchMedicineWithGemini(query: string): Promise<GeminiSearchResult> {
  if (getGeminiMode() === 'mock') return mockSearchResult(query);

  const prompt = `${PROMPTS.MEDICINE_SEARCH}

User query: "${query}"`;

  try {
    const text = await callGeminiText(prompt);
    return parseGeminiResponse<GeminiSearchResult>(text);
  } catch (error) {
    console.error('[GIMINI] searchMedicineWithGemini failed:', error);
    const mock = mockSearchResult(query);
    return {
      ...mock,
      suggestions: mock.suggestions.map((s) => ({
        ...s,
        confidence: 0,
        notes: `خطأ أثناء الاتصال بـ Gemini: ${error instanceof Error ? error.message.slice(0, 120) : 'خطأ غير معروف'}`,
      })),
    };
  }
}

/**
 * مقارنة أدوية باستخدام Gemini (مقارنة متقدمة)
 *
 * يُستخدم في: ComparePage
 */
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
        `${m.strength ? `, ${m.strength}` : ''}` +
        `${m.dosageForm ? `, ${m.dosageForm}` : ''}` +
        `${m.company ? `, ${m.company}` : ''}` +
        `${m.priceJOD !== undefined ? `, ${m.priceJOD} JOD` : ''}`
    )
    .join('\n');

  const prompt = `${PROMPTS.MEDICINE_COMPARE}

Medicines to compare:
${medicineList}`;

  try {
    const text = await callGeminiText(prompt);
    return parseGeminiResponse<GeminiCompareResult>(text);
  } catch (error) {
    console.error('[GIMINI] compareMedicinesWithGemini failed:', error);
    const mock = mockCompareResult(names);
    return {
      ...mock,
      notes: `خطأ أثناء الاتصال بـ Gemini: ${error instanceof Error ? error.message.slice(0, 120) : 'خطأ غير معروف'}`,
    };
  }
}

/**
 * جلب رؤى أسعار الأردن للأدوية (للتحديث الدوري كل 3 أيام)
 *
 * يُستخدم في: وظائف التحديث المجدولة
 */
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
      notes: 'وضع تجريبي — أضف VITE_GEMINI_API_ENDPOINT للتفعيل.',
      updatedAt: new Date().toISOString(),
      needsReview: true,
    }));
  }

  const list = medicines.map((m, i) => `${i + 1}. id: ${m.id}, name: ${m.name}`).join('\n');

  const prompt = `${PROMPTS.PRICE_INSIGHTS}

Medicines list:
${list}`;

  try {
    const text = await callGeminiText(prompt);
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
