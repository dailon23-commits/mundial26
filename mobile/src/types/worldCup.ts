export type MatchStatus = 'scheduled' | 'live' | 'finished';

export type Team = {
  id: string;
  name: string;
  group: string;
  flagUrl: string;
  apiId: number;
};

export type Match = {
  id: string;
  apiId: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  status: MatchStatus;
  broadcaster: string;
};

export type StandingRow = {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};
