import type { ApiKeys } from '../types';

type GeminiTextPart = {
    text?: string;
};

type GeminiResponse = {
    candidates?: Array<{
        content?: {
            parts?: GeminiTextPart[];
        };
    }>;
    error?: {
        code?: number;
        message?: string;
        status?: string;
    };
};

type GeminiRequestPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } };

export interface GeminiImage {
    mimeType: string;
    data: string;
}

export interface StructuredGeminiResult<T> {
    data: T;
    model: string;
}

type StructuredCallOptions = {
    images?: GeminiImage[];
    responseJsonSchema?: Record<string, unknown>;
    paidOnly?: boolean;
    preferredModel?: string;
    fallbackModels?: string[];
    mediaResolution?: 'high';
};

const PRIMARY_MODEL = 'gemini-3.6-flash';
const GENERAL_FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-pro'];
export const FOOD_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash'] as const;
export const FOOD_REVIEW_MODEL = 'gemini-3.1-pro-preview';

const cleanJsonText = (text: string): string => {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error('AI 沒有回傳可解析的 JSON 結果，請再試一次');
    }

    return cleaned.slice(firstBrace, lastBrace + 1);
};

const parseGeminiJson = (data: GeminiResponse): unknown => {
    const text = data?.candidates?.[0]?.content?.parts
        ?.map(part => part?.text)
        .filter((partText: unknown): partText is string => typeof partText === 'string')
        .join('');

    if (!text) {
        throw new Error('AI 沒有回傳可解析結果，請再試一次');
    }

    try {
        return JSON.parse(cleanJsonText(text));
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('AI ')) throw error;
        throw new Error('AI 回傳格式不正確，請再試一次');
    }
};

const isRetryableModelError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return message === '429'
        || message.includes('not found')
        || message.includes('not supported')
        || message.includes('resource exhausted')
        || message.includes('unknown name')
        || message.includes('invalid argument')
        || message.includes('invalid json payload');
};

const isRetryableKeyError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return message.includes('api key not valid')
        || message.includes('invalid api key')
        || message.includes('permission denied')
        || message.includes('forbidden');
};

const fetchGemini = async <T>(
    key: string,
    label: string,
    model: string,
    prompt: string,
    options: StructuredCallOptions,
    updateStatus: ((status: string) => void) | null
): Promise<T> => {
    updateStatus?.(`${label}：${model} 分析中...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const parts: GeminiRequestPart[] = [{ text: prompt }];
    for (const image of options.images ?? []) {
        parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }

    const generationConfig: Record<string, unknown> = {
        responseMimeType: 'application/json'
    };
    if (options.responseJsonSchema) {
        generationConfig.responseJsonSchema = options.responseJsonSchema;
    }
    if ((options.images?.length ?? 0) > 0 && options.mediaResolution === 'high') {
        generationConfig.mediaResolution = 'MEDIA_RESOLUTION_HIGH';
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig
        })
    });

    if (response.status === 429) throw new Error('429');
    const data = await response.json() as GeminiResponse;
    if (!response.ok || data.error) {
        throw new Error(data.error?.message || `Gemini API 錯誤（${response.status}）`);
    }
    return parseGeminiJson(data) as T;
};

export const callGeminiStructured = async <T = Record<string, unknown>>(
    prompt: string,
    updateStatus: ((status: string) => void) | null,
    apiKeys: ApiKeys,
    options: StructuredCallOptions = {}
): Promise<StructuredGeminiResult<T>> => {
    const preferredModel = options.preferredModel ?? PRIMARY_MODEL;
    const models = [preferredModel, ...(options.fallbackModels ?? GENERAL_FALLBACK_MODELS)]
        .filter((model, index, all) => all.indexOf(model) === index);

    const keyCandidates = options.paidOnly
        ? [{ key: apiKeys.paid, label: '付費金鑰' }]
        : [
            { key: apiKeys.free1, label: '免費金鑰' },
            { key: apiKeys.free2, label: '免費金鑰' },
            { key: apiKeys.free3, label: '免費金鑰' },
            { key: apiKeys.free4, label: '免費金鑰' },
            { key: apiKeys.free5, label: '免費金鑰' },
            { key: apiKeys.paid, label: '付費金鑰' }
        ];

    if (options.paidOnly && !apiKeys.paid) {
        throw new Error('食物照片與健康備註只使用付費 Gemini 服務，請先在設定中填入 Paid Key');
    }
    if (!keyCandidates.some(candidate => candidate.key)) {
        throw new Error('請先到設定填入 Google Gemini API Key');
    }

    let lastError: unknown = null;
    for (const candidate of keyCandidates) {
        if (!candidate.key) continue;
        for (const model of models) {
            try {
                const data = await fetchGemini<T>(
                    candidate.key,
                    candidate.label,
                    model,
                    prompt,
                    options,
                    updateStatus
                );
                return { data, model };
            } catch (error) {
                lastError = error;
                if (isRetryableModelError(error)) continue;
                if (isRetryableKeyError(error)) break;
                throw error;
            }
        }
    }

    if (lastError instanceof Error && lastError.message !== '429') throw lastError;
    throw new Error('所有可用的 Gemini 模型目前都無法使用，請稍後再試');
};

/**
 * General-purpose compatibility wrapper for coach, activity, water and resistance calls.
 */
export const callGeminiWithFallback = async <T = Record<string, unknown>>(
    prompt: string,
    base64Image: string | null,
    updateStatus: ((status: string) => void) | null,
    apiKeys: ApiKeys
): Promise<T> => {
    const result = await callGeminiStructured<T>(prompt, updateStatus, apiKeys, {
        images: base64Image ? [{ mimeType: 'image/jpeg', data: base64Image }] : []
    });
    return result.data;
};
