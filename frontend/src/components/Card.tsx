import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Card as PaperCard, useTheme } from 'react-native-paper';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: number;
}

export function Card({ children, style, onPress, elevation = 1 }: CardProps) {
  return (
    <PaperCard
      style={[styles.card, style]}
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
    backgroundColor: '#121212',
    borderRadius: 12,
    borderColor: '#222',
    borderWidth: 1,
    overflow: 'hidden',
  },
});
