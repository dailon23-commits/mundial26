import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/layout';
import type { Team } from '../types/worldCup';

type Props = {
  team: Team;
  align?: 'left' | 'right';
};

export function TeamBadge({ team, align = 'left' }: Props) {
  const [failedImage, setFailedImage] = useState(false);
  const canShowImage = team.flagUrl && !failedImage;

  const flag = canShowImage ? (
    <Image
      source={{ uri: team.flagUrl }}
      style={styles.flag}
      onError={() => setFailedImage(true)}
    />
  ) : (
    <View style={styles.flagFallback}>
      <Text style={styles.flagFallbackText}>{team.name.slice(0, 2)}</Text>
    </View>
  );

  const name = (
    <Text
      numberOfLines={1}
      style={[styles.name, align === 'right' && styles.nameRight]}
    >
      {team.name}
    </Text>
  );

  return (
    <View style={[styles.container, align === 'right' && styles.right]}>
      {align === 'right' ? (
        <>
          {name}
          {flag}
        </>
      ) : (
        <>
          {flag}
          {name}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  right: {
    justifyContent: 'flex-end',
  },
  flag: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    height: 28,
    width: 28,
  },
  flagFallback: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  flagFallbackText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  name: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  nameRight: {
    textAlign: 'right',
  },
});
