import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manifestPath = resolve(process.argv[2] || 'benchmarks/food-analysis/manifest.json');

const mean = values => values.length
  ? values.reduce((total, value) => total + value, 0) / values.length
  : 0;

const percent = value => `${(value * 100).toFixed(1)}%`;
const number = value => Number(value.toFixed(2));

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!Array.isArray(manifest.cases) || manifest.cases.length === 0) {
  throw new Error('基準資料至少需要一筆含人工真值的案例');
}

const variants = [...new Set(
  manifest.cases.flatMap(testCase => testCase.runs?.map(run => run.variant) ?? [])
)];

const reports = variants.map(variant => {
  const samples = manifest.cases.flatMap(testCase =>
    (testCase.runs ?? [])
      .filter(run => run.variant === variant)
      .map(run => ({ groundTruth: testCase.groundTruth, run }))
  );
  const valid = samples.filter(sample => sample.run.valid !== false);
  for (const sample of valid) {
    if (!sample.run.predicted || !sample.run.range
      || !Number.isFinite(sample.groundTruth?.calories)
      || !Number.isFinite(sample.run.predicted.calories)
      || !Number.isFinite(sample.run.range.low)
      || !Number.isFinite(sample.run.range.high)) {
      throw new Error(`案例 ${sample.run.caseId || 'unknown'} 缺少 groundTruth、predicted 或 range`);
    }
  }
  const calorieErrors = valid.map(sample =>
    Math.abs(sample.run.predicted.calories - sample.groundTruth.calories)
  );
  const calorieMape = valid
    .filter(sample => sample.groundTruth.calories > 0)
    .map(sample =>
      Math.abs(sample.run.predicted.calories - sample.groundTruth.calories)
      / sample.groundTruth.calories
    );
  const intervalCoverage = valid.filter(sample =>
    sample.groundTruth.calories >= sample.run.range.low
    && sample.groundTruth.calories <= sample.run.range.high
  ).length / Math.max(1, valid.length);
  const signedBias = valid.map(sample =>
    sample.run.predicted.calories - sample.groundTruth.calories
  );
  const macroMae = Object.fromEntries(
    ['protein', 'carbs', 'fat', 'fiber'].map(nutrient => [
      nutrient,
      number(mean(valid
        .filter(sample => Number.isFinite(sample.groundTruth[nutrient])
          && Number.isFinite(sample.run.predicted[nutrient]))
        .map(sample => Math.abs(
          sample.run.predicted[nutrient] - sample.groundTruth[nutrient]
        ))))
    ])
  );
  const amountMape = valid
    .filter(sample => sample.groundTruth.amount > 0 && sample.run.predicted.amount >= 0)
    .map(sample => Math.abs(
      sample.run.predicted.amount - sample.groundTruth.amount
    ) / sample.groundTruth.amount);
  const confidenceCalibration = Object.fromEntries(
    ['high', 'medium', 'low'].map(confidence => {
      const group = valid.filter(sample => sample.run.confidence === confidence);
      const errors = group
        .filter(sample => sample.groundTruth.calories > 0)
        .map(sample => Math.abs(
          sample.run.predicted.calories - sample.groundTruth.calories
        ) / sample.groundTruth.calories);
      return [confidence, { runs: group.length, calorieMape: percent(mean(errors)) }];
    })
  );
  const recognitionSamples = valid.filter(sample =>
    typeof sample.run.recognizedCorrectly === 'boolean'
  );

  return {
    variant,
    cases: new Set(samples.map(sample => sample.run.caseId)).size,
    runs: samples.length,
    validJsonRate: percent(valid.length / Math.max(1, samples.length)),
    calorieMae: number(mean(calorieErrors)),
    calorieMape: percent(mean(calorieMape)),
    calorieBias: number(mean(signedBias)),
    macroMae,
    amountMape: amountMape.length ? percent(mean(amountMape)) : 'n/a',
    intervalCoverage: percent(intervalCoverage),
    recognitionAccuracy: recognitionSamples.length
      ? percent(recognitionSamples.filter(sample => sample.run.recognizedCorrectly).length / recognitionSamples.length)
      : 'n/a',
    confidenceCalibration,
    averageLatencyMs: Math.round(mean(valid.map(sample => sample.run.latencyMs ?? 0))),
    averageEstimatedCostUsd: number(mean(valid.map(sample => sample.run.estimatedCostUsd ?? 0)))
  };
});

process.stdout.write(`${JSON.stringify({
  dataset: manifest.name,
  caseCount: manifest.cases.length,
  requiredRunsPerCase: manifest.requiredRunsPerCase ?? 3,
  reports
}, null, 2)}\n`);
