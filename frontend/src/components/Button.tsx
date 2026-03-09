import React from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle | TextStyle[];
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
  const { colors } = useTheme();

  let buttonColor;
  let textColor;

  if (mode === 'contained') {
    buttonColor = colors.primary;
    textColor = colors.primaryText;
  } else if (mode === 'outlined' || mode === 'text') {
    textColor = colors.primary;
  }

  return (
    <PaperButton
      onPress={onPress}
      mode={mode}
      style={[styles.button, mode === 'outlined' && { borderColor: colors.primary }, style]}
      labelStyle={[styles.label, labelStyle]}
      buttonColor={buttonColor}
      textColor={textColor}
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
