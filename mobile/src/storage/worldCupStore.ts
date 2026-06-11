import AsyncStorage from '@react-native-async-storage/async-storage';
import seed from '../data/worldCupSeed.json';
import type { Match, Team } from '../types/worldCup';

const STORAGE_KEY = 'mundial26.worldCupData.v1';
const LAST_REMOTE_SYNC_KEY = 'mundial26.lastRemoteSync.v1';
const REMOTE_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const remoteDataUrl = process.env.EXPO_PUBLIC_WORLD_CUP_DATA_URL;

type WorldCupData = {
  teams: Team[];
  matches: Match[];
};

function sortMatches(matches: Match[]) {
  return [...matches].sort(
    (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
  );
}

function sortTeams(teams: Team[]) {
  return [...teams].sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return a.name.localeCompare(b.name);
  });
}

function normalizeData(data: WorldCupData): WorldCupData {
  return {
    teams: sortTeams(data.teams || []),
    matches: sortMatches(data.matches || []),
  };
}

async function saveData(data: WorldCupData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)));
}

async function loadLocalData() {
  const serialized = await AsyncStorage.getItem(STORAGE_KEY);

  if (serialized) {
    const localData = normalizeData(JSON.parse(serialized) as WorldCupData);
    const seedData = normalizeData(seed as WorldCupData);

    if (localData.matches.length === 0 && seedData.matches.length > 0) {
      await saveData(seedData);
      return seedData;
    }

    return localData;
  }

  const initialData = normalizeData(seed as WorldCupData);
  await saveData(initialData);
  return initialData;
}

function hasUsableRemoteUrl() {
  return Boolean(remoteDataUrl && /^https?:\/\//.test(remoteDataUrl));
}

async function shouldSyncRemote(forceRemoteSync: boolean) {
  if (forceRemoteSync) {
    return true;
  }

  const lastRemoteSync = await AsyncStorage.getItem(LAST_REMOTE_SYNC_KEY);
  if (!lastRemoteSync) {
    return true;
  }

  return Date.now() - Number(lastRemoteSync) > REMOTE_SYNC_INTERVAL_MS;
}

export async function syncWorldCupDataFromRemote(): Promise<WorldCupData> {
  if (!hasUsableRemoteUrl()) {
    return loadLocalData();
  }

  const url = remoteDataUrl as string;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo actualizar el calendario (${response.status}).`);
  }

  const remoteData = normalizeData((await response.json()) as WorldCupData);
  await saveData(remoteData);
  await AsyncStorage.setItem(LAST_REMOTE_SYNC_KEY, String(Date.now()));
  return remoteData;
}

export async function getWorldCupData(options?: {
  forceRemoteSync?: boolean;
}): Promise<WorldCupData> {
  if (hasUsableRemoteUrl() && (await shouldSyncRemote(Boolean(options?.forceRemoteSync)))) {
    try {
      return await syncWorldCupDataFromRemote();
    } catch (error) {
      console.warn(error);
    }
  }

  return loadLocalData();
}

export async function getMatches(options?: { forceRemoteSync?: boolean }): Promise<Match[]> {
  const data = await getWorldCupData(options);
  return data.matches;
}

export async function getTeams(options?: { forceRemoteSync?: boolean }): Promise<Team[]> {
  const data = await getWorldCupData(options);
  return data.teams;
}

export async function updateMatchBroadcaster(matchId: string, broadcaster: string) {
  const data = await getWorldCupData();
  const matches = data.matches.map((match) =>
    match.id === matchId ? { ...match, broadcaster: broadcaster.trim() } : match,
  );

  await saveData({ ...data, matches });
  return sortMatches(matches);
}

export async function replaceWorldCupData(data: WorldCupData) {
  await saveData(data);
}

export async function resetWorldCupData() {
  const initialData = normalizeData(seed as WorldCupData);
  await saveData(initialData);
  return initialData;
}
