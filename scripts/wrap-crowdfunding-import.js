const fs = require('fs');
const path = require('path');
const query = fs.readFileSync(path.join(__dirname, '../docs/stabilisation/crowdfunding-import.sql'), 'utf8');
fs.writeFileSync(path.join(__dirname, '../docs/stabilisation/crowdfunding-import-mcp.json'), JSON.stringify({ project_id: 'rtfjwpytiuvoekomevpu', query }));
console.log('Prepared Crowdfunding import payload.');
