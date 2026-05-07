import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';

/**
 * Hook to prevent screen capturing and recording.
 * Useful for sensitive pages like balance, transactions, etc.
 */
export function usePrivacy(enabled = true) {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    if (enabled) {
      ScreenCapture.preventScreenCaptureAsync();
    } else {
      ScreenCapture.allowScreenCaptureAsync();
    }

    // Cleanup: allow capture when component unmounts
    return () => {
      if (Platform.OS !== 'web') {
        ScreenCapture.allowScreenCaptureAsync();
      }
    };
  }, [enabled]);
}
