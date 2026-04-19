import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFamilyContext } from '../context/FamilyContext'
import AnalyticsScreen from '../screens/AnalyticsScreen'
import OnboardingScreen from '../screens/OnboardingScreen'
import WelcomeScreen from '../screens/WelcomeScreen'
import TaskDetailScreen from '../screens/TaskDetailScreen'
import { colors } from '../theme'
import MainTabs from './MainTabs'

const Stack = createNativeStackNavigator()

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.border,
    primary: colors.primary,
  },
}

export default function RootNavigator() {
  const { hasFamily } = useFamilyContext()

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        key={hasFamily ? 'main' : 'onboard'}
        screenOptions={{ headerShown: false }}
      >
        {!hasFamily ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="TaskDetail"
              component={TaskDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
