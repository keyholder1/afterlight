// Root navigator — structure matches docs/03-information-architecture.md
// exactly: AuthStack / PairingStack / MainTabs, with the Camera as a modal
// presented over MainTabs rather than a tab of its own.
//
// `devAuthState` below is a Phase 0 stand-in for real session/pairing state,
// which lands in Phase 1. It defaults to "authenticated + paired" so the
// MainTabs shell (the thing Phase 0 needs to prove renders) is what boots by
// default; flip it to see the Welcome/Pairing placeholders.

import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ThemeProvider, useTheme, useAppFonts } from './src/theme';
import { getDb } from './src/db';
import WelcomeScreen from './src/screens/WelcomeScreen';
import PairingHomeScreen from './src/screens/PairingHomeScreen';
import HomeTimelineScreen from './src/screens/HomeTimelineScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import CameraScreen from './src/screens/CameraScreen';

const devAuthState = { isAuthenticated: true, isPaired: true };

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// A "tab" that isn't really a tab — pressing it opens the Camera modal
// instead of switching tabs. See docs/03-information-architecture.md:
// "Center item opens the Camera as a modal, not a persistent tab."
function CaptureTabPlaceholder() {
  return null;
}

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.bgSurface,
          borderTopColor: theme.colors.borderHairline,
        },
        // Tab bar icons/label removal per docs/01-product-spec.md § UI
        // philosophy land with the real component build in Phase 3.
      }}
    >
      <Tab.Screen name="Home" component={HomeTimelineScreen} />
      <Tab.Screen
        name="Capture"
        component={CaptureTabPlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('CameraModal');
          },
        })}
      />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isPaired } = devAuthState;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Welcome" component={WelcomeScreen} />
      ) : !isPaired ? (
        <RootStack.Screen name="PairingHome" component={PairingHomeScreen} />
      ) : (
        <RootStack.Screen name="MainTabs" component={MainTabs} />
      )}
      <RootStack.Screen
        name="CameraModal"
        component={CameraScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </RootStack.Navigator>
  );
}

function AppShell() {
  const { fontsLoaded, fontError } = useAppFonts();

  // Opens (and, on first launch, creates) the local SQLite database. Every
  // screen's real reads/writes go through repositories built on top of this
  // in later phases — Phase 0 just proves the schema applies without error.
  useEffect(() => {
    getDb().catch((err) => {
      console.error('Failed to open local database', err);
    });
  }, []);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#FAF7F2' }} />;
  }

  if (fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Font load failed: {fontError.message}</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
