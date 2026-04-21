import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <View className={`space-y-2 mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">
          {label}
        </Text>
      )}
      <View className={`bg-surface border ${error ? 'border-red-500' : 'border-border'} rounded-2xl px-4 h-14 justify-center`}>
        <TextInput
          className={`text-white text-base ${className}`}
          placeholderTextColor="rgba(255,255,255,0.3)"
          {...props}
        />
      </View>
      {error && (
        <Text className="text-red-500 text-xs font-medium mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
};
