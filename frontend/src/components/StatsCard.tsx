import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { getXpForNextLevel, getXpForCurrentLevel } from '../utils/sm2';

interface StatsCardProps {
  totalXp: number;
  level: number;
  streak: number;
  todayCards: number;
  dailyGoal: number;
}

export function StatsCard({ totalXp, level, streak, todayCards, dailyGoal }: StatsCardProps) {
  const currentLevelXp = getXpForCurrentLevel(level);
  const nextLevelXp = getXpForNextLevel(level);
  const levelProgress = (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <MaterialCommunityIcons name="star-circle" size={20} color="#FCD34D" />
          <Text style={styles.levelText}>Level {level}</Text>
        </View>
        <View style={styles.streakBadge}>
          <MaterialCommunityIcons name="fire" size={18} color="#F97316" />
          <Text style={styles.streakText}>{streak} day{streak !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={styles.xpContainer}>
        <Text style={styles.xpLabel}>XP Progress</Text>
        <ProgressBar
          progress={levelProgress}
          color="#8B5CF6"
          height={10}
        />
        <Text style={styles.xpText}>
          {totalXp} / {nextLevelXp} XP
        </Text>
      </View>

      <View style={styles.dailyContainer}>
        <Text style={styles.dailyLabel}>Daily Goal</Text>
        <ProgressBar
          progress={todayCards / dailyGoal}
          color="#22C55E"
          height={10}
        />
        <Text style={styles.dailyText}>
          {todayCards} / {dailyGoal} cards
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
  },
  xpContainer: {
    marginBottom: 16,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  xpText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'right',
  },
  dailyContainer: {},
  dailyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  dailyText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'right',
  },
});
