import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ANIMAL_AVATARS } from '../lib/avatars'
import { colors, radius, shadows } from '../theme'

export default function AnimalAvatarPicker({ selected, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Выбери свою иконку</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {ANIMAL_AVATARS.map(animal => (
          <Pressable
            key={animal.id}
            onPress={() => onSelect(animal.id)}
            style={({ pressed }) => [
              styles.item,
              selected === animal.id && styles.itemSelected,
              pressed && styles.itemPressed,
            ]}
          >
            <Text style={styles.emoji}>{animal.emoji}</Text>
            <Text style={styles.name}>{animal.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scroll: {
    gap: 10,
    paddingVertical: 4,
  },
  item: {
    width: 80,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    ...shadows.press,
  },
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  itemPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
