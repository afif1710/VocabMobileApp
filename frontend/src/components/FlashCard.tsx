import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { VocabularyCard } from '../types';

const { width } = Dimensions.get('window');

interface FlashCardProps {
  card: VocabularyCard;
  onResponse: (response: 'again' | 'hard' | 'good' | 'easy') => void;
  showAnswer: boolean;
  onFlip: () => void;
}

export function FlashCard({ card, onResponse, showAnswer, onFlip }: FlashCardProps) {
  const flipProgress = useSharedValue(showAnswer ? 1 : 0);

  React.useEffect(() => {
    flipProgress.value = withTiming(showAnswer ? 1 : 0, { duration: 300 });
  }, [showAnswer]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity: flipProgress.value < 0.5 ? 1 : 0,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity: flipProgress.value >= 0.5 ? 1 : 0,
    };
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={onFlip}
        activeOpacity={0.95}
      >
        {/* Front of card */}
        <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
          <View style={styles.partOfSpeech}>
            <Text style={styles.partOfSpeechText}>{card.partOfSpeech}</Text>
          </View>
          <Text style={styles.word}>{card.word}</Text>
          {card.pronunciation && (
            <Text style={styles.pronunciation}>{card.pronunciation}</Text>
          )}
          <View style={styles.tapHint}>
            <MaterialCommunityIcons name="gesture-tap" size={24} color="#9CA3AF" />
            <Text style={styles.tapHintText}>Tap to reveal meaning</Text>
          </View>
        </Animated.View>

        {/* Back of card */}
        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <View style={styles.partOfSpeech}>
            <Text style={styles.partOfSpeechText}>{card.partOfSpeech}</Text>
          </View>
          <Text style={styles.wordSmall}>{card.word}</Text>
          <View style={styles.meaningsContainer}>
            {card.meanings.map((meaning, index) => (
              <Text key={index} style={styles.meaning}>
                {index + 1}. {meaning}
              </Text>
            ))}
          </View>
          {card.exampleSentences.length > 0 && (
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>Example:</Text>
              <Text style={styles.example}>"{card.exampleSentences[0]}"</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {showAnswer && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.responseButton, styles.againButton]}
            onPress={() => onResponse('again')}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.responseButton, styles.hardButton]}
            onPress={() => onResponse('hard')}
          >
            <MaterialCommunityIcons name="emoticon-confused" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.responseButton, styles.goodButton]}
            onPress={() => onResponse('good')}
          >
            <MaterialCommunityIcons name="emoticon-happy" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.responseButton, styles.easyButton]}
            onPress={() => onResponse('easy')}
          >
            <MaterialCommunityIcons name="emoticon-cool" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Easy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cardContainer: {
    width: width - 40,
    height: 350,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardFront: {
    backgroundColor: '#FFF',
  },
  cardBack: {
    backgroundColor: '#F0FDF4',
  },
  partOfSpeech: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  partOfSpeechText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  word: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  wordSmall: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  pronunciation: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  tapHint: {
    position: 'absolute',
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tapHintText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  meaningsContainer: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  meaning: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 26,
  },
  exampleContainer: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  exampleLabel: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginBottom: 4,
  },
  example: {
    fontSize: 14,
    color: '#166534',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 8,
    gap: 8,
  },
  responseButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  againButton: {
    backgroundColor: '#EF4444',
  },
  hardButton: {
    backgroundColor: '#F97316',
  },
  goodButton: {
    backgroundColor: '#22C55E',
  },
  easyButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
