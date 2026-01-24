import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface XpPopupProps {
  xp: number;
  combo: number;
  visible: boolean;
  onHide: () => void;
}

export function XpPopup({ xp, combo, visible, onHide }: XpPopupProps) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      opacity.value = withSpring(1);
      translateY.value = withSequence(
        withSpring(-20, { damping: 10 }),
        withSpring(-60, { damping: 15 }, () => {
          opacity.value = withSpring(0);
          runOnJS(onHide)();
        })
      );
    } else {
      scale.value = 0;
      translateY.value = 0;
      opacity.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="star" size={24} color="#FCD34D" />
        <Text style={styles.xpText}>+{xp} XP</Text>
        {combo > 1 && (
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>{combo}x</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  xpText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FCD34D',
  },
  comboBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comboText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
