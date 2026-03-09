import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Deck } from '../types';
import { Card } from './Card';
import { useTheme } from '../theme/ThemeContext';

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  dueCount?: number;
}

export function DeckCard({ deck, onPress, dueCount = 0 }: DeckCardProps) {
  const { colors } = useTheme();
  const iconName = getIconName(deck.icon);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card style={styles.cardContainer}>
        <View style={styles.row}>
          <View style={[styles.iconContainer, { backgroundColor: deck.color + '20' }]}>
            <MaterialCommunityIcons name={iconName} size={28} color={deck.color} />
          </View>
          <View style={styles.content}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{deck.name}</Text>
            {deck.description ? (
              <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
                {deck.description}
              </Text>
            ) : null}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="cards-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{deck.cardCount || 0} words</Text>
              </View>
              {dueCount > 0 && (
                <View style={[styles.stat, styles.dueStat]}>
                  <View style={styles.dueDot} />
                  <Text style={styles.dueText}>{dueCount} due</Text>
                </View>
              )}
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function getIconName(icon: string): any {
  const iconMap: Record<string, any> = {
    book: 'book-open-variant',
    school: 'school',
    airplane: 'airplane',
    star: 'star',
    heart: 'heart',
    flag: 'flag',
    lightbulb: 'lightbulb',
    music: 'music',
    camera: 'camera',
    default: 'cards',
  };
  return iconMap[icon] || iconMap.default;
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dueStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
  },
  dueText: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '700',
  },
});
