import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// adjust this import path to your real file:
import { useAppStore } from '../src/stores/appStore';

export default function RootLayout() {
  const initialize = useAppStore(s => s.initialize);
  const isInitialized = useAppStore(s => s.isInitialized);
  const isLoading = useAppStore(s => s.isLoading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0c0c0c', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style="light" />
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0c0c0c' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
