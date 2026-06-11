import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const {
  FOOTBALL_DATA_TOKEN,
  FOOTBALL_DATA_COMPETITION = 'WC',
} = process.env;

const footballDataBaseUrl = 'https://api.football-data.org/v4';
const currentDir = dirname(fileURLToPath(import.meta.url));
const outputPaths = [
  resolve(currentDir, '../mobile/src/data/worldCupSeed.json'),
  resolve(currentDir, '../mobile/public/worldCupData.json'),
  resolve(currentDir, '../public/worldCupData.json'),
];

if (!FOOTBALL_DATA_TOKEN || FOOTBALL_DATA_TOKEN === 'your-football-data-token') {
  throw new Error('Missing FOOTBALL_DATA_TOKEN in ingestion/.env.');
}

async function footballDataGet(path) {
  const response = await fetch(`${footballDataBaseUrl}${path}`, {
    headers: {
      'X-Auth-Token': FOOTBALL_DATA_TOKEN,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Football-Data request failed ${response.status}: ${body}`);
  }

  return response.json();
}

function normalizeStatus(apiStatus) {
  const status = String(apiStatus || '').toUpperCase();

  if (['IN_PLAY', 'PAUSED'].includes(status)) {
    return 'live';
  }

  if (['FINISHED', 'AWARDED'].includes(status)) {
    return 'finished';
  }

  return 'scheduled';
}

function normalizeScore(match, side) {
  const score = match.score?.fullTime?.[side] ?? match.score?.regularTime?.[side];
  return Number.isInteger(score) ? score : null;
}

async function getGroupNameByTeamId() {
  try {
    const standings = await footballDataGet(
      `/competitions/${FOOTBALL_DATA_COMPETITION}/standings`,
    );
    const map = new Map();

    for (const standing of standings.standings || []) {
      const groupName = String(standing.group || '').replace(/^GROUP_/, '');
      if (!/^[A-H]$/.test(groupName)) {
        continue;
      }

      for (const row of standing.table || []) {
        if (row.team?.id) {
          map.set(row.team.id, groupName);
        }
      }
    }

    return map;
  } catch (error) {
    console.warn(`Could not fetch standings/groups yet: ${error.message}`);
    return new Map();
  }
}

function mapTeam(apiTeam, groupNameByTeamId) {
  return {
    id: String(apiTeam.id),
    name: apiTeam.shortName || apiTeam.tla || apiTeam.name,
    group: groupNameByTeamId.get(apiTeam.id) || '',
    flagUrl: apiTeam.crest || '',
    apiId: apiTeam.id,
  };
}

async function syncLocalJson() {
  const groupNameByTeamId = await getGroupNameByTeamId();
  const data = await footballDataGet(
    `/competitions/${FOOTBALL_DATA_COMPETITION}/matches`,
  );
  const teamsById = new Map();
  const matches = [];

  for (const match of data.matches || []) {
    if (!match.homeTeam?.id || !match.awayTeam?.id) {
      continue;
    }

    teamsById.set(match.homeTeam.id, mapTeam(match.homeTeam, groupNameByTeamId));
    teamsById.set(match.awayTeam.id, mapTeam(match.awayTeam, groupNameByTeamId));
    matches.push({
      id: String(match.id),
      apiId: match.id,
      homeTeam: mapTeam(match.homeTeam, groupNameByTeamId),
      awayTeam: mapTeam(match.awayTeam, groupNameByTeamId),
      homeScore: normalizeScore(match, 'home'),
      awayScore: normalizeScore(match, 'away'),
      matchDate: match.utcDate,
      status: normalizeStatus(match.status),
      broadcaster: '',
    });
  }

  const payload = {
    teams: Array.from(teamsById.values()).sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.name.localeCompare(b.name);
    }),
    matches: matches.sort(
      (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
    ),
  };

  await Promise.all(
    outputPaths.map((outputPath) =>
      writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8'),
    ),
  );

  console.log(`Wrote ${payload.matches.length} matches to:`);
  for (const outputPath of outputPaths) {
    console.log(`- ${outputPath}`);
  }
}

syncLocalJson().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
