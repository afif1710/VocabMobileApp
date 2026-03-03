import React from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  style?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

export function Button({
  onPress,
  children,
  mode = 'contained',
  style,
  labelStyle,
  disabled,
  loading,
  icon,
}: ButtonProps) {
  return (
    <PaperButton
      onPress={onPress}
      mode={mode}
      style={[styles.button, style]}
      labelStyle={[styles.label, labelStyle]}
      disabled={disabled}
      loading={loading}
      icon={icon}
      contentStyle={styles.content}
    >
      {children}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingVertical: 4,
  },
  content: {
    height: 48,
  },
});
