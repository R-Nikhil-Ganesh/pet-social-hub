import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface PetTagProps {
  breed: string;
  age: number;
  species?: string;
  compact?: boolean;
  onPress?: () => void;
}

export function PetTag({ breed, age, species, compact, onPress }: PetTagProps) {
  const ageLabel = age < 1 ? 'Puppy' : age === 1 ? '1 yr' : `${age} yrs`;
  const iconName = species === 'cat' ? 'logo-octocat' : species === 'bird' ? 'logo-twitter' : 'paw-outline';

  const content = (
    <>
      <Ionicons name={iconName} size={13} color="#6B21A8" style={styles.icon} />
      <ThemedText style={[styles.text, compact && styles.textCompact]}>{breed}</ThemedText>
      <View style={styles.dot} />
      <ThemedText style={[styles.text, compact && styles.textCompact]}>{ageLabel}</ThemedText>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 1,
  },
  text: {
    fontSize: 12,
    color: '#6B21A8',
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 11,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#A78BFA',
  },
});
