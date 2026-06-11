import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState } from '../components/EmptyState';
import { getMatches, getTeams } from '../storage/worldCupStore';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/layout';
import type { Match, Team } from '../types/worldCup';
import { calculateStandings } from '../utils/standings';

export function StandingsScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (forceRemoteSync = false) => {
    try {
      setError(null);
      const [nextMatches, nextTeams] = await Promise.all([
        getMatches({ forceRemoteSync }),
        getTeams({ forceRemoteSync }),
      ]);
      setMatches(nextMatches);
      setTeams(nextTeams);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudo cargar la clasificacion.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const standings = useMemo(
    () => calculateStandings(matches, teams),
    [matches, teams],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="No se pudo abrir la clasificacion"
        message={`${error}\nLos datos se guardan localmente en este dispositivo.`}
      />
    );
  }

  if (standings.length === 0) {
    return (
      <EmptyState
        title="Clasificacion pendiente"
        message="Cuando los equipos tengan grupo A-H y existan partidos, esta tabla se calculara automaticamente."
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={() => {
            setRefreshing(true);
            void load(true);
          }}
        />
      }
    >
      {standings.map(({ group, rows }) => (
        <View key={group} style={styles.groupCard}>
          <Text style={styles.groupTitle}>Grupo {group}</Text>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.teamCell]}>Equipo</Text>
            <Text style={styles.headerCell}>PJ</Text>
            <Text style={styles.headerCell}>DG</Text>
            <Text style={styles.headerCell}>Pts</Text>
          </View>
          {rows.map((row, index) => (
            <View key={row.team.id} style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Text numberOfLines={1} style={styles.teamName}>
                {row.team.name}
              </Text>
              <Text style={styles.cell}>{row.played}</Text>
              <Text style={styles.cell}>{row.goalDifference}</Text>
              <Text style={styles.points}>{row.points}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  groupTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  headerRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: spacing.sm,
  },
  headerCell: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    width: 44,
  },
  teamCell: {
    flex: 1,
    textAlign: 'left',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 42,
  },
  rank: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    width: 24,
  },
  teamName: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  cell: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    width: 44,
  },
  points: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    width: 44,
  },
});
