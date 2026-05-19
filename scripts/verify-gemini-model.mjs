import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const expectedModel = 'gemini-3.5-flash';

const checks = [
  {
    file: 'src/services/gemini.ts',
    required: [`const PRIMARY_MODEL = '${expectedModel}';`],
    forbidden: ['gemini-3.1-pro-preview']
  },
  {
    file: 'src/components/modals/SettingsPanel.tsx',
    required: ['Gemini 3.5 Flash'],
    forbidden: ['Gemini 3.1 Pro Preview']
  },
  {
    file: 'README.md',
    required: [expectedModel, 'Gemini 3.5 Flash'],
    forbidden: ['gemini-3.1-pro-preview']
  }
];

let hasFailure = false;

for (const check of checks) {
  const fullPath = path.join(rootDir, check.file);
  const content = fs.readFileSync(fullPath, 'utf8');

  for (const text of check.required) {
    if (!content.includes(text)) {
      console.error(`${check.file} is missing: ${text}`);
      hasFailure = true;
    }
  }

  for (const text of check.forbidden) {
    if (content.includes(text)) {
      console.error(`${check.file} still contains old model text: ${text}`);
      hasFailure = true;
    }
  }
}

if (hasFailure) {
  process.exit(1);
}

console.log(`Gemini model references point to ${expectedModel}.`);
