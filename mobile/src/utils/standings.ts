import type { Match, StandingRow, Team } from '../types/worldCup';

function emptyRow(team: Team): StandingRow {
  return {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function addResult(row: StandingRow, goalsFor: number, goalsAgainst: number) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.wins += 1;
    row.points += 3;
  } else if (goalsFor === goalsAgainst) {
    row.draws += 1;
    row.points += 1;
  } else {
    row.losses += 1;
  }
}

export function calculateStandings(matches: Match[], teams: Team[]) {
  const byGroup = new Map<string, Map<string, StandingRow>>();

  for (const team of teams) {
    if (!team.group) {
      continue;
    }

    if (!byGroup.has(team.group)) {
      byGroup.set(team.group, new Map());
    }

    byGroup.get(team.group)?.set(team.id, emptyRow(team));
  }

  for (const match of matches) {
    if (
      match.status !== 'finished' ||
      match.homeScore === null ||
      match.awayScore === null ||
      !match.homeTeam.group ||
      match.homeTeam.group !== match.awayTeam.group
    ) {
      continue;
    }

    const group = byGroup.get(match.homeTeam.group);
    const homeRow = group?.get(match.homeTeam.id);
    const awayRow = group?.get(match.awayTeam.id);

    if (!homeRow || !awayRow) {
      continue;
    }

    addResult(homeRow, match.homeScore, match.awayScore);
    addResult(awayRow, match.awayScore, match.homeScore);
  }

  return Array.from(byGroup.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, rows]) => ({
      group,
      rows: Array.from(rows.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) {
          return b.goalDifference - a.goalDifference;
        }
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.team.name.localeCompare(b.team.name);
      }),
    }));
}
