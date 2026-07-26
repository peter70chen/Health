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

class GeminiRequestError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly rawMessage: string
    ) {
        super(message);
        this.name = 'GeminiRequestError';
    }
}

export const normalizeGeminiApiKey = (key: string): string => {
    const trimmed = key.trim();
    const hasMatchingQuotes = (
        (trimmed.startsWith('"') && trimmed.endsWith('"'))
        || (trimmed.startsWith("'") && trimmed.endsWith("'"))
    );
    return hasMatchingQuotes ? trimmed.slice(1, -1).trim() : trimmed;
};

const createGeminiRequestError = (message: string, status: number): GeminiRequestError => {
    const normalized = message.toLowerCase();

    if (
        normalized.includes('api key not valid')
        || normalized.includes('invalid api key')
        || normalized.includes('unregistered callers')
    ) {
        return new GeminiRequestError(
            '這個 Gemini API Key 無效，請確認已完整貼上，且沒有多餘空白。',
            status,
            message
        );
    }
    if (
        normalized.includes('referer')
        || normalized.includes('referrer')
        || normalized.includes('api_key_service_blocked')
    ) {
        return new GeminiRequestError(
            '這個 Key 的網站限制不允許 Health App 使用。請在 Google Cloud 將 peter-health.netlify.app 加入允許清單。',
            status,
            message
        );
    }
    if (
        status === 429
        || normalized.includes('resource exhausted')
        || normalized.includes('quota')
    ) {
        return new GeminiRequestError(
            'Gemini API 額度暫時用完，請稍後再試，並確認這個 Key 所屬專案已啟用計費。',
            status,
            message
        );
    }
    if (
        status === 403
        || normalized.includes('permission denied')
        || normalized.includes('forbidden')
        || normalized.includes('has not been used')
        || normalized.includes('is disabled')
    ) {
        return new GeminiRequestError(
            '這個 Key 目前沒有 Gemini API 使用權限，請確認已啟用 Gemini API 與計費。',
            status,
            message
        );
    }

    return new GeminiRequestError(
        message || `Gemini API 錯誤（${status}）`,
        status,
        message
    );
};

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
    const message = (
        error instanceof GeminiRequestError
            ? `${error.message} ${error.rawMessage}`
            : error.message
    ).toLowerCase();
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
    const message = (
        error instanceof GeminiRequestError
            ? `${error.message} ${error.rawMessage}`
            : error.message
    ).toLowerCase();
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
    const normalizedKey = normalizeGeminiApiKey(key);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(normalizedKey)}`;
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

    const data = await response.json() as GeminiResponse;
    if (!response.ok || data.error) {
        throw createGeminiRequestError(
            data.error?.message || `Gemini API 錯誤（${response.status}）`,
            response.status
        );
    }
    return parseGeminiJson(data) as T;
};

export const validateGeminiApiKey = async (key: string): Promise<string> => {
    const normalizedKey = normalizeGeminiApiKey(key);
    if (!normalizedKey) {
        throw new Error('請先輸入 Gemini API Key');
    }

    let lastError: unknown = null;
    for (const model of FOOD_MODELS) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(normalizedKey)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [{ text: 'Reply with exactly OK.' }]
                        }],
                        generationConfig: { maxOutputTokens: 8 }
                    })
                }
            );
            const data = await response.json() as GeminiResponse;
            if (response.ok && !data.error) return model;

            const error = createGeminiRequestError(
                data.error?.message || `Gemini API 錯誤（${response.status}）`,
                response.status
            );
            lastError = error;
            if (isRetryableModelError(error)) continue;
            throw error;
        } catch (error) {
            if (error instanceof GeminiRequestError) throw error;
            if (error instanceof TypeError) {
                throw new Error('目前無法連線到 Gemini，請檢查網路後再試。');
            }
            lastError = error;
        }
    }

    if (lastError instanceof Error) throw lastError;
    throw new Error('目前找不到可用的 Gemini 食物辨識模型，請稍後再試。');
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
        ? [{ key: normalizeGeminiApiKey(apiKeys.paid), label: '付費金鑰' }]
        : [
            { key: normalizeGeminiApiKey(apiKeys.free1), label: '免費金鑰' },
            { key: normalizeGeminiApiKey(apiKeys.free2), label: '免費金鑰' },
            { key: normalizeGeminiApiKey(apiKeys.free3), label: '免費金鑰' },
            { key: normalizeGeminiApiKey(apiKeys.free4), label: '免費金鑰' },
            { key: normalizeGeminiApiKey(apiKeys.free5), label: '免費金鑰' },
            { key: normalizeGeminiApiKey(apiKeys.paid), label: '付費金鑰' }
        ];

    if (options.paidOnly && !apiKeys.paid) {
        throw new Error('食物照片與健康備註只使用付費 Gemini 服務，請先在設定中填入 Gemini API Key');
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

    if (lastError instanceof Error) throw lastError;
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
