import type { ApiKeys } from '../types';

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

        // Use Gemini 3.0 Pro (Preview) for best accuracy in 2026
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${key}`;

        const parts: any[] = [{ text: prompt }];
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

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    };

    const tryKey = async (key: string | undefined, label: string) => {
        if (!key) throw new Error("SKIP");
        try {
            return await fetchGemini(key, label);
        } catch (e: any) {
            if (e.message !== "429") throw e;
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
