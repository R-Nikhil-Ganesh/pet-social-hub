import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useGameStore } from '@/store/gameStore';

export default function BreedGuessScreen() {
  const { breedGuesses, fetchBreedGuesses, submitBreedGuess } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBreedGuesses().finally(() => setLoading(false));
  }, [fetchBreedGuesses]);

  const current = breedGuesses[currentIndex];

  const handleGuess = async (guess: string) => {
    if (!current || submitting || current.user_guess) return;
    setSubmitting(true);
    try {
      const correct = await submitBreedGuess(current.id, guess);
      Alert.alert(correct ? 'Correct' : 'Not quite', correct ? 'Nice guess.' : 'Try the next one.');
    } catch {
      Alert.alert('Error', 'Could not submit guess.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <ThemedText style={styles.empty}>No breed guesses available.</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Breed Guess</ThemedText>
        <ThemedText style={styles.subtitle}>
          Card {currentIndex + 1} of {breedGuesses.length}
        </ThemedText>
        <Image source={{ uri: current.media_url }} style={styles.image} resizeMode="cover" />
        <View style={styles.options}>
          {current.options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.optionBtn}
              onPress={() => handleGuess(option)}
              disabled={submitting || Boolean(current.user_guess)}
            >
              <ThemedText style={styles.optionText}>{option}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        {current.user_guess ? (
          <View style={styles.resultBox}>
            <ThemedText style={styles.resultText}>
              {current.correct ? 'Correct' : `Actual breed: ${current.actual_breed}`}
            </ThemedText>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.nextBtn, currentIndex >= breedGuesses.length - 1 && styles.nextBtnDisabled]}
          onPress={() => setCurrentIndex((index) => Math.min(index + 1, breedGuesses.length - 1))}
          disabled={currentIndex >= breedGuesses.length - 1}
        >
          <ThemedText style={styles.nextText}>Next</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#71717A' },
  content: { flex: 1, padding: 16, gap: 14 },
  title: { fontSize: 24, fontWeight: '800', color: '#18181B' },
  subtitle: { fontSize: 13, color: '#71717A' },
  image: { width: '100%', height: 300, borderRadius: 18, backgroundColor: '#E4E4E7' },
  options: { gap: 10 },
  optionBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  optionText: { fontSize: 15, fontWeight: '600', color: '#18181B' },
  resultBox: { backgroundColor: '#EDE9FE', borderRadius: 14, padding: 14 },
  resultText: { color: '#5B21B6', fontWeight: '700' },
  nextBtn: {
    marginTop: 'auto',
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: '#D4D4D8' },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});