import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/layout';
import type { Match } from '../types/worldCup';
import { formatTime } from '../utils/dates';
import { TeamBadge } from './TeamBadge';

type Props = {
  match: Match;
  onSaveBroadcaster?: (broadcaster: string) => Promise<void>;
};

function scoreText(match: Match) {
  if (match.homeScore === null || match.awayScore === null) {
    return formatTime(match.matchDate);
  }

  return `${match.homeScore} - ${match.awayScore}`;
}

function statusText(match: Match) {
  if (match.status === 'live') return 'LIVE';
  if (match.status === 'finished') return 'Final';
  return formatTime(match.matchDate);
}

export function MatchCard({ match, onSaveBroadcaster }: Props) {
  const isLive = match.status === 'live';
  const [isEditing, setIsEditing] = useState(false);
  const [draftBroadcaster, setDraftBroadcaster] = useState(match.broadcaster);
  const [saving, setSaving] = useState(false);

  async function saveBroadcaster() {
    if (!onSaveBroadcaster) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSaveBroadcaster(draftBroadcaster);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Pressable
        style={[styles.card, isLive && styles.liveCard]}
        onPress={() => {
          setDraftBroadcaster(match.broadcaster);
          setIsEditing(true);
        }}
      >
        <View style={styles.topRow}>
          <Text style={styles.status}>{statusText(match)}</Text>
          {isLive && <View style={styles.liveDot} />}
        </View>

        <View style={styles.matchRow}>
          <TeamBadge team={match.homeTeam} />
          <View style={styles.scoreBox}>
            <Text style={[styles.score, isLive && styles.liveScore]}>
              {scoreText(match)}
            </Text>
          </View>
          <TeamBadge team={match.awayTeam} align="right" />
        </View>

        <View style={styles.footer}>
          <Text numberOfLines={1} style={styles.broadcaster}>
            {match.broadcaster ? `TV: ${match.broadcaster}` : 'TV por definir'}
          </Text>
        </View>
      </Pressable>

      <Modal
        animationType="fade"
        transparent
        visible={isEditing}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Canal de TV</Text>
            <Text style={styles.modalSubtitle}>
              {match.homeTeam.name} vs {match.awayTeam.name}
            </Text>
            <TextInput
              value={draftBroadcaster}
              onChangeText={setDraftBroadcaster}
              placeholder="Ej: TVN, DSports, FIFA+"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              autoCapitalize="words"
            />
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={saveBroadcaster}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Guardando' : 'Guardar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  liveCard: {
    borderColor: colors.live,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  status: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  liveDot: {
    backgroundColor: colors.live,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  matchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  scoreBox: {
    alignItems: 'center',
    minWidth: 68,
  },
  score: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  liveScore: {
    color: colors.live,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  broadcaster: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
    width: '100%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  button: {
    alignItems: 'center',
    borderRadius: radii.sm,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: colors.surfaceAlt,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
