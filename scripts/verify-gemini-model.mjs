import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const serviceFile = path.join(rootDir, 'src/services/gemini.ts');
const serviceSource = fs.readFileSync(serviceFile, 'utf8');
const requiredReferences = [
  "const PRIMARY_MODEL = 'gemini-3.6-flash';",
  "'gemini-3.5-flash'",
  "export const FOOD_REVIEW_MODEL = 'gemini-3.1-pro-preview';"
];

for (const reference of requiredReferences) {
  if (!serviceSource.includes(reference)) {
    throw new Error(`src/services/gemini.ts is missing: ${reference}`);
  }
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log('Gemini model references are correct. Set GEMINI_API_KEY to run a live schema check.');
  process.exit(0);
}

const model = 'gemini-3.6-flash';
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Return the number 1.' }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['value'],
          properties: {
            value: { type: 'number', minimum: 1, maximum: 1 }
          }
        }
      }
    })
  }
);
const data = await response.json();
if (!response.ok || data.error) {
  throw new Error(data.error?.message || `Gemini live check failed (${response.status})`);
}
const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
const parsed = JSON.parse(text);
if (parsed.value !== 1) throw new Error('Gemini live schema check returned an unexpected value');

console.log(`Gemini live structured-output check passed with ${data.modelVersion || model}.`);
