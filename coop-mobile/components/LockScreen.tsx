import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function LockScreen() {
  const { unlockApp, logout, user } = useAuth();

  useEffect(() => {
    // Attempt unlock on mount
    unlockApp();
  }, []);

  return (
    <LinearGradient
      colors={['#000000', '#1a1a1a']}
      style={styles.container}
    >
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#fbbf24" />
          </View>
          <Text style={styles.title}>Secure Access</Text>
          <Text style={styles.subtitle}>
            Welcome back, {user?.firstName || 'Member'}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.unlockButton}
            onPress={() => unlockApp()}
          >
            <Ionicons name="finger-print" size={24} color="#000000" />
            <Text style={styles.unlockText}>Unlock with Biometrics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => logout()}
          >
            <Text style={styles.logoutText}>Switch Account / Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Your data is encrypted and protected.
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
  },
  actions: {
    width: '100%',
    paddingHorizontal: 40,
    gap: 16,
  },
  unlockButton: {
    backgroundColor: '#fbbf24',
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  unlockText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  logoutButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
  },
  footer: {
    color: '#52525b',
    fontSize: 12,
  }
});
