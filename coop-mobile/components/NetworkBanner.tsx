import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export function NetworkBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(!state.isConnected);
    };

    const interval = setInterval(checkNetwork, 5000);
    checkNetwork();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      translateY.set(isOffline ? 0 : -120);
      opacity.set(withTiming(isOffline ? 1 : 0, { duration: 180 }));
    } else {
      translateY.set(
        withTiming(isOffline ? 0 : -120, {
          duration: 220,
          easing: EASE_OUT,
        })
      );
      opacity.set(
        withTiming(isOffline ? 1 : 0, {
          duration: 180,
          easing: EASE_OUT,
        })
      );
    }
  }, [isOffline, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: translateY.get() }],
  }));

  return (
    <Animated.View
      pointerEvents={isOffline ? 'auto' : 'none'}
      style={[
        styles.banner,
        { paddingTop: Math.max(insets.top, 16) + 6 },
        animatedStyle,
      ]}
    >
      <Ionicons name="cloud-offline" size={20} color="#ffffff" />
      <Text style={styles.text}>You are currently offline. Some features may be unavailable.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ef4444',
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    gap: 10,
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
