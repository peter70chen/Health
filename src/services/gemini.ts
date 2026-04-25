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
        message?: string;
    };
};

type GeminiRequestPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } };

const cleanJsonText = (text: string): string => {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("AI 沒有回傳可解析的 JSON 結果，請再試一次");
    }

    return cleaned.slice(firstBrace, lastBrace + 1);
};

const parseGeminiJson = (data: GeminiResponse): unknown => {
    const text = data?.candidates?.[0]?.content?.parts
        ?.map(part => part?.text)
        .filter((partText: unknown): partText is string => typeof partText === 'string')
        .join('');

    if (!text) {
        throw new Error("AI 沒有回傳可解析結果，請再試一次");
    }

    try {
        return JSON.parse(cleanJsonText(text));
    } catch (error) {
        if (error instanceof Error && error.message.startsWith("AI ")) {
            throw error;
        }
        throw new Error("AI 回傳格式不正確，請再試一次");
    }
};

/**
 * Call Gemini API with fallback to multiple keys
 * Tries free keys first, then falls back to paid key
 */
export const callGeminiWithFallback = async (
    prompt: string,
    base64Image: string | null,
    updateStatus: ((status: string) => void) | null,
    apiKeys: ApiKeys
): Promise<any> => {
    if (!apiKeys.free1 && !apiKeys.free2 && !apiKeys.free3 && !apiKeys.free4 && !apiKeys.free5 && !apiKeys.paid) {
        throw new Error("請先點擊左上角 [SETTING] 設定 Google Gemini API Key");
    }

    const fetchGemini = async (key: string, typeLabel: string) => {
        if (updateStatus) updateStatus(`🔄 ${typeLabel}辨識中...`);

        // Use Gemini 3.1 Flash-Lite Preview for image recognition requests.
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${key}`;

        const parts: GeminiRequestPart[] = [{ text: prompt }];
        if (base64Image) {
            parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Image } });
        }

        const payload = {
            contents: [{ parts }],
            generationConfig: { responseMimeType: "application/json" }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.status === 429) throw new Error("429");

        const data = await response.json() as GeminiResponse;
        if (data.error) throw new Error(data.error.message);

        return parseGeminiJson(data);
    };

    const tryKey = async (key: string | undefined, label: string) => {
        if (!key) throw new Error("SKIP");
        try {
            return await fetchGemini(key, label);
        } catch (e: unknown) {
            if (!(e instanceof Error) || e.message !== "429") throw e;
            return null;
        }
    };

    let res;
    if ((res = await tryKey(apiKeys.free1, "免費金鑰"))) return res;
    if ((res = await tryKey(apiKeys.free2, "免費金鑰"))) return res;
    if ((res = await tryKey(apiKeys.free3, "免費金鑰"))) return res;
    if ((res = await tryKey(apiKeys.free4, "免費金鑰"))) return res;
    if ((res = await tryKey(apiKeys.free5, "免費金鑰"))) return res;

    if (updateStatus) updateStatus(`💰 付費金鑰辨識中...`);
    return await fetchGemini(apiKeys.paid, "付費金鑰");
};
