const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

const { createClient } = require('@supabase/supabase-js');
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Configuration Supabase manquante dans .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log("Connecté à Supabase via REST/PostgREST");
  const { data, error } = await supabase.from('agora_live_channels').select('*').limit(1);
  if (error) {
    console.log("Statut table agora_live_channels:", error.message);
  } else {
    console.log("✅ agora_live_channels est déjà présente en base !");
  }

  const rpcRes = await supabase.rpc('exec_sql', { query: 'SELECT 1;' });
  console.log("rpc exec_sql test:", rpcRes.error?.message || "Existe!");
}

check();
