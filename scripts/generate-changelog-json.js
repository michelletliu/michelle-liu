const { execSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

function formatDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // Always format in America/Los_Angeles so the date matches Michelle's local day
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  }).formatToParts(date);

  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  const year = parts.find((p) => p.type === 'year')?.value;

  return `${month}-${day}-${year}`;
}

function getLatestCommitDate() {
  try {
    const latestCommitIso = execSync('git log -1 --format=%cI', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    return formatDate(latestCommitIso);
  } catch {
    return null;
  }
}

function main() {
  const publicDir = join(process.cwd(), 'public');
  const targetPath = join(publicDir, 'changelog.json');
  const latestCommitDate = getLatestCommitDate();

  mkdirSync(publicDir, { recursive: true });
  writeFileSync(
    targetPath,
    JSON.stringify(
      {
        latestCommitDate,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  console.log(
    `Generated public/changelog.json (${latestCommitDate ?? 'no commit date available'})`,
  );
}

main();
