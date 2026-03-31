import { StyleSheet, View } from 'react-native'
import { colors, radius, shadows } from '../theme'

export default function GlassCard({ children, style, elevated = true }) {
  return (
    <View style={[styles.card, elevated && shadows.card, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
})
