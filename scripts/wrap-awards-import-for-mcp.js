const fs = require('fs');
const path = require('path');
const sqlPath = path.join(__dirname, '../docs/stabilisation/awards-import.sql');
const outputPath = path.join(__dirname, '../docs/stabilisation/awards-import-mcp.json');
const payload = {
  project_id: 'rtfjwpytiuvoekomevpu',
  query: fs.readFileSync(sqlPath, 'utf8'),
};
fs.writeFileSync(outputPath, JSON.stringify(payload));
console.log(`Prepared ${outputPath} (${payload.query.length} chars).`);
