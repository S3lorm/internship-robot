#!/usr/bin/env node
/**
 * Backfill legacy letter reference numbers (LR-YYYYMMDD-…) to RMU/{dept}/1223/{seq}.
 *
 * Usage:
 *   node scripts/backfill-letter-references.js
 *   node scripts/backfill-letter-references.js --dry-run
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { backfillLegacyLetterReferences } = require('../services/letterReferenceService');

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun ? 'Dry run — no database writes' : 'Backfilling letter reference numbers…');

  const result = await backfillLegacyLetterReferences({ dryRun });

  if (dryRun && result.planned?.length) {
    console.log(`Would update ${result.planned.length} letter request(s):`);
    for (const row of result.planned) {
      console.log(`  ${row.id}: ${row.oldRef || '(null)'} → ${row.newRef}`);
    }
  } else {
    console.log(`Updated ${result.updated} letter request(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
