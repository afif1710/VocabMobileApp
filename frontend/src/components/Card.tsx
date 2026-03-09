import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
}

export function Card({ children, style, onPress, elevation = 1 }: CardProps) {
  const { colors } = useTheme();
  
  return (
    <PaperCard
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      mode="elevated"
      elevation={elevation}
      onPress={onPress}
    >
      <PaperCard.Content>{children}</PaperCard.Content>
    </PaperCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
