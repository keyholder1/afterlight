// Root navigator — structure matches docs/03-information-architecture.md:
// AuthStack / PairingStack / MainTabs, with Camera and Settings presented as
// modals over MainTabs rather than tabs of their own. Which branch renders
// is now driven by real session/profile/pair state via useAppBootstrap
// (Phase 1) — the Phase 0 devAuthState placeholder is gone.

import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ThemeProvider, useTheme, useAppFonts } from './src/theme';
import { getDb } from './src/db';
import { useAppBootstrap } from './src/lib/useAppBootstrap';
import WelcomeScreen from './src/screens/WelcomeScreen';
import EmailEntryScreen from './src/screens/EmailEntryScreen';
import OtpVerifyScreen from './src/screens/OtpVerifyScreen';
import DisplayNameScreen from './src/screens/DisplayNameScreen';
import PairingHomeScreen from './src/screens/PairingHomeScreen';
import HomeTimelineScreen from './src/screens/HomeTimelineScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import DayDetailScreen from './src/screens/DayDetailScreen';
import StoryPlaybackScreen from './src/screens/StoryPlaybackScreen';
import CameraScreen from './src/screens/CameraScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { HomeIcon, CalendarIcon, CameraIcon } from './src/components/ui/icons';

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const CalendarStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// docs/03-information-architecture.md: CalendarStack = CalendarMonth + DayDetail,
// with StoryPlaybackModal presented full-screen from DayDetail.
function CalendarFlow({ userId, pairId }: { userId: string; pairId: string }) {
  return (
    <CalendarStackNav.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStackNav.Screen name="CalendarMonth">
        {({ navigation }) => <CalendarScreen navigation={navigation} userId={userId} pairId={pairId} />}
      </CalendarStackNav.Screen>
      <CalendarStackNav.Screen name="DayDetail" component={DayDetailScreen} />
      <CalendarStackNav.Screen
        name="StoryPlaybackModal"
        component={StoryPlaybackScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </CalendarStackNav.Navigator>
  );
}

// A "tab" that isn't really a tab — pressing it opens the Camera modal
// instead of switching tabs. See docs/03-information-architecture.md:
// "Center item opens the Camera as a modal, not a persistent tab."
function CaptureTabPlaceholder() {
  return null;
}

function MainTabs({
  userId,
  pairId,
  partnerName,
}: {
  userId: string;
  pairId: string;
  partnerName: string | null;
}) {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // no labels — see docs/01-product-spec.md § UI philosophy
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.bgSurface,
          borderTopColor: theme.colors.borderHairline,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{ tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}
      >
        {({ navigation }) => (
          <HomeTimelineScreen
            navigation={navigation}
            userId={userId}
            pairId={pairId}
            partnerName={partnerName}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Capture"
        component={CaptureTabPlaceholder}
        options={{
          tabBarIcon: ({ color }) => (
            <View style={[styles.captureFab, { backgroundColor: theme.colors.accent, borderColor: theme.colors.bgSurface }]}>
              <CameraIcon color="#fff" />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('CameraModal', { userId, pairId });
          },
        })}
      />
      <Tab.Screen
        name="Calendar"
        options={{ tabBarIcon: ({ color }) => <CalendarIcon color={color} /> }}
      >
        {() => <CalendarFlow userId={userId} pairId={pairId} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AuthFlow() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStackNav.Screen name="EmailEntry" component={EmailEntryScreen} />
      <AuthStackNav.Screen name="OtpVerify" component={OtpVerifyScreen} />
    </AuthStackNav.Navigator>
  );
}

function LoadingView() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bgCanvas }}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}

function RootNavigator() {
  const bootstrap = useAppBootstrap();

  if (bootstrap.status === 'loading') return <LoadingView />;
  if (bootstrap.status === 'unauthenticated') return <AuthFlow />;
  if (bootstrap.status === 'needsProfile') {
    return <DisplayNameScreen userId={bootstrap.userId!} onDone={bootstrap.refresh} />;
  }
  if (bootstrap.status === 'needsPairing') {
    return <PairingHomeScreen userId={bootstrap.userId!} onPaired={bootstrap.refresh} />;
  }

  // ready
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs">
        {() => (
          <MainTabs userId={bootstrap.userId!} pairId={bootstrap.pair!.id} partnerName={bootstrap.partnerName} />
        )}
      </RootStack.Screen>
      <RootStack.Screen
        name="CameraModal"
        component={CameraScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <RootStack.Screen
        name="SettingsModal"
        component={SettingsScreen}
        options={{ presentation: 'modal' }}
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

const styles = StyleSheet.create({
  captureFab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    borderWidth: 4,
  },
});
