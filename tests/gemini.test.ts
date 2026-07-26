import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  callGeminiStructured,
  normalizeGeminiApiKey,
  simplifyGeminiJsonSchema,
  validateGeminiApiKey
} from '../src/services/gemini';
import type { ApiKeys } from '../src/types';

const keys: ApiKeys = {
  free1: 'free-key',
  free2: '',
  free3: '',
  free4: '',
  free5: '',
  paid: 'paid-key'
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Gemini privacy routing', () => {
  it('rejects personal-data calls without a paid key', async () => {
    await expect(callGeminiStructured(
      'health data',
      null,
      { ...keys, paid: '' },
      { paidOnly: true }
    )).rejects.toThrow('Gemini API Key');
  });

  it('uses only the paid key and only enables high media resolution when requested', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }]
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    await callGeminiStructured(
      'health data',
      null,
      keys,
      {
        paidOnly: true,
        images: [{ mimeType: 'image/jpeg', data: 'base64' }],
        mediaResolution: 'high'
      }
    );

    const [url, request] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('key=paid-key');
    expect(String(url)).not.toContain('free-key');
    const payload = JSON.parse(request.body);
    expect(payload.generationConfig.mediaResolution).toBe('MEDIA_RESOLUTION_HIGH');
  });
});

describe('Gemini API key validation', () => {
  it('removes whitespace and matching quotes introduced while pasting', () => {
    expect(normalizeGeminiApiKey('  "AIza-test-key"\n')).toBe('AIza-test-key');
    expect(normalizeGeminiApiKey(" 'AIza-other-key' ")).toBe('AIza-other-key');
  });

  it('validates the normalized key against the food model', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'OK' }] } }]
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(validateGeminiApiKey('  paid-key\n')).resolves.toBe('gemini-3.6-flash');
    expect(String(fetchMock.mock.calls[0][0])).toContain('key=paid-key');
  });

  it('returns a clear message for an invalid key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: 'API key not valid. Please pass a valid API key.' }
      })
    }));

    await expect(validateGeminiApiKey('bad-key')).rejects.toThrow('API Key 無效');
  });
});

describe('Gemini structured-output compatibility', () => {
  it('removes constraints that make deeply nested Gemini schemas fail', () => {
    const schema = simplifyGeminiJsonSchema({
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          amount: { type: 'number', minimum: 0, maximum: 100 }
        }
      }
    });

    expect(schema).toEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          amount: { type: 'number' }
        }
      }
    });
  });

  it('retries with a schema hint when Gemini rejects the schema parameter', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Request contains an invalid argument.' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }]
        })
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(callGeminiStructured(
      'analyze food',
      null,
      keys,
      {
        paidOnly: true,
        responseJsonSchema: {
          type: 'object',
          required: ['ok'],
          properties: { ok: { type: 'boolean' } }
        }
      }
    )).resolves.toMatchObject({ data: { ok: true } });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retryPayload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(retryPayload.generationConfig.responseJsonSchema).toBeUndefined();
    expect(retryPayload.contents[0].parts[0].text).toContain('請嚴格依照以下 JSON 結構回傳');
  });
});
