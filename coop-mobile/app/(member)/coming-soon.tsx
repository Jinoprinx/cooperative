import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ComingSoon() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black">
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6', '#000000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View className="flex-1 items-center justify-center px-10">
        <View className="bg-white/10 p-8 rounded-[3rem] border border-white/20 items-center w-full shadow-2xl">
          <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-8 border border-white/30">
            <MaterialCommunityIcons name="qrcode-scan" size={48} color="#fff" />
          </View>
          
          <Text className="text-white font-black text-4xl text-center mb-4 tracking-tighter">
            Coming Soon
          </Text>
          
          <Text className="text-white/60 text-center font-bold text-lg mb-10 leading-6">
            We're building a lightning-fast QR payment experience for our members.
          </Text>
          
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-white px-10 py-5 rounded-2xl w-full"
          >
            <Text className="text-black font-black text-center uppercase tracking-widest">Go Back</Text>
          </TouchableOpacity>
        </View>
        
        <View className="mt-12 flex-row items-center space-x-2">
          <View className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <Text className="text-blue-500 font-black uppercase text-[10px] tracking-[0.4em]">Development in progress</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
