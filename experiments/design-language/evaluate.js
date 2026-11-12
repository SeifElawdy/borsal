// Structural results and author-declared expressiveness only. No engineering checks.
const fs = require('fs');
const path = require('path');
const { designSchema } = require('./schema');

function loadExamples() {
  return fs.readdirSync(path.join(__dirname, 'examples')).filter((file) => file.endsWith('.json')).sort()
    .map((file) => JSON.parse(fs.readFileSync(path.join(__dirname, 'examples', file), 'utf8')));
}

function evaluate(design) {
  const result = designSchema.safeParse(design);
  if (!result.success) return { id: design.id, schemaValid: false, errors: result.error.issues, manufacturingVerified: false };
  const data = result.data;
  const partial = new Set(data.limitations.filter((item) => item.status === 'PARTIAL').map((item) => item.featureId));
  const unsupported = new Set(data.limitations.filter((item) => item.status === 'UNSUPPORTED').map((item) => item.featureId));
  return {
    id: data.id, schemaValid: true, manufacturingVerified: false,
    expressed: data.technical.features.filter((item) => !partial.has(item.id) && !unsupported.has(item.id)).map((item) => item.id),
    partial: [...partial], unsupported: [...unsupported],
    missingInformation: [...new Set(data.limitations.flatMap((item) => item.missingInformation))],
  };
}

if (require.main === module) {
  const results = loadExamples().map(evaluate);
  console.log(JSON.stringify(results, null, 2));
  if (results.some((item) => !item.schemaValid)) process.exitCode = 1;
}
module.exports = { loadExamples, evaluate };
