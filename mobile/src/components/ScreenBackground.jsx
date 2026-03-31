import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'
import { colors, gradients } from '../theme'

/** Элегантный чистый градиентный фон */
export default function ScreenBackground({ children }) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={gradients.screen}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.gradientStart },
  content: { flex: 1 },
})
