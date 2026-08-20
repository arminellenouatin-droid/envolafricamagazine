const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../src/data/awards.json');
const outputPath = path.join(__dirname, '../docs/stabilisation/awards-import.sql');
const adminId = '4fecde1b-bfc5-4e46-a3b3-c4281e6c3024';
const db = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const sql = (value) => value === null || value === undefined ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const number = (value) => Number.isFinite(Number(value)) ? String(Number(value)) : 'NULL';
const boolean = (value) => value === true ? 'true' : value === false ? 'false' : 'NULL';

const competitionRows = (db.competitions || []).map((item) => `(${[
  sql(item.id),
  sql(item.slug),
  sql(item.title),
  sql(item.description || ''),
  sql(item.category || 'Awards'),
  sql(item.status || 'draft'),
  number(item.vote_price_cents ?? 0),
  number(item.points_per_vote ?? 1),
  number(item.jury_weight ?? 0),
  number(item.public_vote_weight ?? 100),
  'true',
  sql(adminId),
  sql(item.starts_at || null),
  sql(item.ends_at || null),
  sql(item.created_at || null),
  number(item.candidates_count ?? 0),
  number(item.votes_count ?? 0),
  number(item.pot_amount_cents ?? 0),
  sql(item.cover_image || null),
].join(', ')})`).join(',\n');

const candidateRows = (db.candidates || []).map((item) => `(${[
  sql(item.id),
  sql(item.competition_id),
  'NULL',
  sql(item.display_name),
  sql(item.bio || null),
  sql(item.country || null),
  sql(item.photo_url || null),
  sql(item.video_url || null),
  sql(item.project_description || null),
  sql(item.status || 'pending'),
  sql(item.created_at || null),
  number(item.votes ?? 0),
  number(item.gifts ?? 0),
  number(item.donations ?? 0),
].join(', ')})`).join(',\n');

const output = `-- Generated from ${sourcePath}; review before execution.\n-- Idempotent upsert: no delete/truncate.\n\ninsert into public.awards_competitions\n  (id, slug, title, description, category, status, vote_price_cents, points_per_vote, jury_weight, public_vote_weight, results_public, created_by, starts_at, ends_at, created_at, legacy_candidates_count, legacy_votes_count, legacy_pot_amount_cents, legacy_cover_image)\nvalues\n${competitionRows}\non conflict (id) do update set\n  slug = excluded.slug, title = excluded.title, description = excluded.description, category = excluded.category, status = excluded.status, vote_price_cents = excluded.vote_price_cents, points_per_vote = excluded.points_per_vote, jury_weight = excluded.jury_weight, public_vote_weight = excluded.public_vote_weight, starts_at = excluded.starts_at, ends_at = excluded.ends_at, legacy_candidates_count = excluded.legacy_candidates_count, legacy_votes_count = excluded.legacy_votes_count, legacy_pot_amount_cents = excluded.legacy_pot_amount_cents, legacy_cover_image = excluded.legacy_cover_image;\n\ninsert into public.awards_candidates\n  (id, competition_id, profile_id, display_name, bio, country, photo_url, video_url, project_description, status, created_at, legacy_votes_count, legacy_gifts_count, legacy_donations_cents)\nvalues\n${candidateRows}\non conflict (id) do update set\n  competition_id = excluded.competition_id, display_name = excluded.display_name, bio = excluded.bio, country = excluded.country, photo_url = excluded.photo_url, video_url = excluded.video_url, project_description = excluded.project_description, status = excluded.status, legacy_votes_count = excluded.legacy_votes_count, legacy_gifts_count = excluded.legacy_gifts_count, legacy_donations_cents = excluded.legacy_donations_cents;\n`;

fs.writeFileSync(outputPath, output);
console.log(`Generated ${outputPath}: ${db.competitions?.length || 0} competitions, ${db.candidates?.length || 0} candidates.`);
