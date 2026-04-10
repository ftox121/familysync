import { QueryClientProvider } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import SmartNotificationWorker from './src/components/SmartNotificationWorker'
import { FamilyProvider, useFamilyContext } from './src/context/FamilyContext'
import { TabBarProvider } from './src/context/TabBarContext'
import { queryClientInstance } from './src/lib/queryClient'
import RootNavigator from './src/navigation/RootNavigator'
import { colors, gradients } from './src/theme'

function Gate() {
  const { isLoading, bootError, reloadUser } = useFamilyContext()

  if (isLoading)
    return (
      <View style={styles.boot}>
        <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )

  if (bootError)
    return (
      <View style={styles.boot}>
        <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Нет подключения к backend</Text>
          <Text style={styles.errorText}>Запусти `server` и проверь, что телефон и ПК в одной сети.</Text>
          <Text style={styles.errorHint}>{bootError}</Text>
          <Pressable style={styles.retryBtn} onPress={reloadUser}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      </View>
    )

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
      <SmartNotificationWorker />
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <SafeAreaProvider>
        <FamilyProvider>
          <TabBarProvider>
            <Gate />
          </TabBarProvider>
        </FamilyProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gradientStart,
  },
  errorCard: {
    width: '86%',
    maxWidth: 420,
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.outline,
    gap: 10,
  },
  errorTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  errorText: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  errorHint: { fontSize: 12, color: colors.textMuted },
  retryBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
})
