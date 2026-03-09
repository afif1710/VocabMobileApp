import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Banner, Text as PaperText } from 'react-native-paper';
import { Button, Card } from '../../src/components';
import { useTheme } from '../../src/theme/ThemeContext';

import { useAppStore } from '../../src/stores/appStore';

export default function PracticeScreen() {
  const { colors } = useTheme();
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();

  const isInitialized = useAppStore(s => s.isInitialized);
  const isLoading = useAppStore(s => s.isLoading);

  const startPracticeSession = useAppStore(s => s.startPracticeSession);
  const reviewCard = useAppStore(s => s.reviewCard);
  const nextCard = useAppStore(s => s.nextCard);

  const currentSessionCards = useAppStore(s => s.currentSessionCards);
  const currentCardIndex = useAppStore(s => s.currentCardIndex);

  const current = useMemo(
    () => currentSessionCards[currentCardIndex] ?? null,
    [currentSessionCards, currentCardIndex]
  );

  const [showHelp, setShowHelp] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  // Flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipToBack = () => {
    Animated.spring(flipAnim, {
      toValue: 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start(() => setIsFlipped(true));
  };

  const flipToFront = () => {
    Animated.spring(flipAnim, {
      toValue: 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start(() => setIsFlipped(false));
  };

  const handleTap = () => {
    if (isFlipped) return;
    flipToBack();
  };

  useEffect(() => {
    if (!isInitialized) return;
    startPracticeSession(deckId ?? undefined, 50);
  }, [isInitialized, startPracticeSession, deckId]);

  // Reset flip when card changes
  useEffect(() => {
    flipAnim.setValue(0);
    setIsFlipped(false);
  }, [currentCardIndex]);

  const meaningsText = useMemo(() => {
    if (!current?.meanings) return '';
    return Array.isArray(current.meanings) ? current.meanings.join(', ') : String(current.meanings);
  }, [current]);

  const examples = useMemo(() => {
    if (!current?.exampleSentences) return [];
    return Array.isArray(current.exampleSentences)
      ? current.exampleSentences
      : [String(current.exampleSentences)];
  }, [current]);

  const onResponse = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!current) return;
    await reviewCard(current, rating);
    if (currentCardIndex + 1 >= currentSessionCards.length) {
      await startPracticeSession(deckId ?? undefined, 50);
    } else {
      nextCard();
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator animating color={colors.primary} />
          <PaperText style={{ color: colors.muted }}>Preparing practice…</PaperText>
        </View>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <PaperText style={[styles.title, { color: colors.textPrimary }]}>Practice</PaperText>
          <PaperText style={{ color: colors.muted, textAlign: 'center' }}>No cards available. Check Decks tab.</PaperText>
          <Button mode="contained" onPress={() => startPracticeSession(deckId ?? undefined, 50)} style={{ marginTop: 12 }}>
            Restart session
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const progress = currentSessionCards.length > 0
    ? ((currentCardIndex) / currentSessionCards.length)
    : 0;

  // Front: rotateY 0→90  Back: rotateY -90→0
  const frontRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  const backRotateY  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.4, 0.5], outputRange: [1, 1, 0] });
  const backOpacity  = flipAnim.interpolate({ inputRange: [0.5, 0.6, 1], outputRange: [0, 1, 1] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <PaperText style={[styles.title, { color: colors.textPrimary }]}>Practice</PaperText>
        <PaperText style={{ color: colors.muted, fontSize: 13 }}>
          Card {currentCardIndex + 1} of {currentSessionCards.length}
        </PaperText>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      {showHelp ? (
        <Banner
          visible
          actions={[{ label: 'Got it', onPress: () => setShowHelp(false), textColor: colors.primary }]}
          icon="information"
          style={{ backgroundColor: colors.surfaceElevated, borderRadius: 12 }}
        >
          <PaperText style={{ color: colors.textPrimary, fontSize: 13 }}>
            Tap the card to reveal the meaning. Then rate how well you knew it.
          </PaperText>
        </Banner>
      ) : null}

      {/* Flashcard */}
      <TouchableOpacity onPress={handleTap} activeOpacity={0.95} style={styles.cardContainer}>
        {/* FRONT — shows the word */}
        <Animated.View
          style={[
            styles.flashcard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            { transform: [{ rotateY: frontRotateY }], opacity: frontOpacity },
          ]}
        >
          <PaperText style={[styles.tapHint, { color: colors.muted }]}>TAP TO REVEAL</PaperText>
          <PaperText style={[styles.word, { color: colors.textPrimary }]}>{current.word}</PaperText>
          <PaperText style={[styles.pos, { color: colors.primary }]}>{current.partOfSpeech ?? ''}</PaperText>
        </Animated.View>

        {/* BACK — shows meaning + examples */}
        <Animated.View
          style={[
            styles.flashcard,
            styles.flashcardBack,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.primary },
            { transform: [{ rotateY: backRotateY }], opacity: backOpacity },
          ]}
        >
          <PaperText style={[styles.word, { color: colors.textPrimary, fontSize: 26 }]}>{current.word}</PaperText>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PaperText style={[styles.sectionLabel, { color: colors.primary }]}>MEANING</PaperText>
          <PaperText style={[styles.meaning, { color: colors.textPrimary }]}>{meaningsText}</PaperText>
          {examples.length > 0 && (
            <>
              <PaperText style={[styles.sectionLabel, { color: colors.muted, marginTop: 14 }]}>EXAMPLE</PaperText>
              <PaperText style={[styles.example, { color: colors.textSecondary }]}>• {examples[0]}</PaperText>
            </>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Rating buttons — only visible after flip */}
      {isFlipped && (
        <View style={styles.ratingRow}>
          <Button
            mode="outlined"
            onPress={() => onResponse('again')}
            style={[styles.ratingBtn, { borderColor: colors.danger }]}
            labelStyle={{ color: colors.danger, fontSize: 12 }}
          >
            Again
          </Button>
          <Button
            mode="outlined"
            onPress={() => onResponse('hard')}
            style={[styles.ratingBtn, { borderColor: '#f0a500' }]}
            labelStyle={{ color: '#f0a500', fontSize: 12 }}
          >
            Hard
          </Button>
          <Button
            mode="outlined"
            onPress={() => onResponse('good')}
            style={[styles.ratingBtn, { borderColor: colors.success }]}
            labelStyle={{ color: colors.success, fontSize: 12 }}
          >
            Good
          </Button>
          <Button
            mode="contained"
            onPress={() => onResponse('easy')}
            style={[styles.ratingBtn, { backgroundColor: colors.primary }]}
            labelStyle={{ fontSize: 12 }}
          >
            Easy
          </Button>
        </View>
      )}

      {!isFlipped && (
        <View style={styles.centerHint}>
          <PaperText style={{ color: colors.muted, textAlign: 'center', fontSize: 13 }}>
            👆 Tap the card to reveal the answer
          </PaperText>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  header: { gap: 2 },
  title: { fontSize: 24, fontWeight: '900' },

  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  cardContainer: { flex: 1, marginTop: 8 },
  flashcard: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  flashcardBack: { borderWidth: 2 },

  tapHint: { fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: 24 },
  word: { fontSize: 36, fontWeight: '900', textAlign: 'center' },
  pos: { marginTop: 8, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },

  divider: { height: 1, width: '100%', marginVertical: 16 },

  sectionLabel: { fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  meaning: { fontSize: 18, lineHeight: 26, fontWeight: '500', textAlign: 'center' },
  example: { fontSize: 14, lineHeight: 21, fontStyle: 'italic', textAlign: 'center' },

  ratingRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingBottom: 4 },
  ratingBtn: { flex: 1, minWidth: 0 },

  centerHint: { alignItems: 'center', paddingBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
});
