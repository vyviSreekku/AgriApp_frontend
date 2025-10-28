import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import BottomTabNavigator from './src/navigation/BottomTabNavigator';

// registerRootComponent calls AppRegistry.registerComponent('main', () => AppRoot);
// Use BottomTabNavigator as the root so all screens have a navigation container
registerRootComponent(BottomTabNavigator);
