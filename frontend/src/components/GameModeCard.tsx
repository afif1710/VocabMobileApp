import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface GameModeCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
  bestScore?: number;
}

export function GameModeCard({
  title,
  description,
  icon,
  color,
  onPress,
  bestScore,
}: GameModeCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={28} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {bestScore !== undefined && (
          <View style={styles.scoreContainer}>
            <MaterialCommunityIcons name="trophy" size={14} color="#F59E0B" />
            <Text style={styles.scoreText}>Best: {bestScore}</Text>
          </View>
        )}
      </View>
      <MaterialCommunityIcons name="play-circle" size={32} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
});
