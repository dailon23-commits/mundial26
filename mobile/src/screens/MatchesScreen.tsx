import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState } from '../components/EmptyState';
import { MatchCard } from '../components/MatchCard';
import { getMatches, updateMatchBroadcaster } from '../storage/worldCupStore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/layout';
import type { Match } from '../types/worldCup';
import { dateKey, formatDateLabel } from '../utils/dates';

type MatchSection = {
  title: string;
  data: Match[];
};

export function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (forceRemoteSync = false) => {
    try {
      setError(null);
      const nextMatches = await getMatches({ forceRemoteSync });
      setMatches(nextMatches);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los partidos.',
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

  const sections = useMemo<MatchSection[]>(() => {
    const groups = new Map<string, Match[]>();

    for (const match of matches) {
      const key = dateKey(match.matchDate);
      groups.set(key, [...(groups.get(key) || []), match]);
    }

    return Array.from(groups.entries()).map(([, data]) => ({
      title: formatDateLabel(data[0].matchDate),
      data,
    }));
  }, [matches]);

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
        title="No se pudo abrir el calendario"
        message={`${error}\nLos datos se guardan localmente en este dispositivo.`}
      />
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
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
      ListEmptyComponent={
        <EmptyState
          title="Aun no hay partidos"
          message="Cuando cargues o importes partidos, quedaran guardados en este dispositivo para usarlos sin servidor."
        />
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <MatchCard
          match={item}
          onSaveBroadcaster={async (broadcaster) => {
            const updatedMatches = await updateMatchBroadcaster(item.id, broadcaster);
            setMatches(updatedMatches);
          }}
        />
      )}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    backgroundColor: colors.background,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    textTransform: 'capitalize',
  },
});
