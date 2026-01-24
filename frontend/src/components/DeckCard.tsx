import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Deck } from '../types';

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  dueCount?: number;
}

export function DeckCard({ deck, onPress, dueCount = 0 }: DeckCardProps) {
  const iconName = getIconName(deck.icon);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconContainer, { backgroundColor: deck.color + '20' }]}>
        <MaterialCommunityIcons name={iconName} size={32} color={deck.color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{deck.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {deck.description}
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="cards" size={16} color="#6B7280" />
            <Text style={styles.statText}>{deck.cardCount} cards</Text>
          </View>
          {dueCount > 0 && (
            <View style={[styles.stat, styles.dueStat]}>
              <MaterialCommunityIcons name="clock-alert" size={16} color="#F97316" />
              <Text style={[styles.statText, styles.dueText]}>{dueCount} due</Text>
            </View>
          )}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  dueStat: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dueText: {
    color: '#F97316',
    fontWeight: '600',
  },
});
