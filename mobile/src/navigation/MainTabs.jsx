import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import AddTaskScreen from '../screens/AddTaskScreen'
import FamilyChatScreen from '../screens/FamilyChatScreen'
import RewardsScreen from '../screens/RewardsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import TasksScreen from '../screens/TasksScreen'
import GlassTabBar from './GlassTabBar'

const Tab = createBottomTabNavigator()

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Tasks"
      tabBar={props => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Chat" component={FamilyChatScreen} />
      <Tab.Screen name="AddTask" component={AddTaskScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
