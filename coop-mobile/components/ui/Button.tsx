import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { styled } from 'nativewind';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  const baseStyles = "rounded-2xl items-center justify-center flex-row px-6";
  
  const variants = {
    primary: "bg-primary shadow-lg shadow-primary/20",
    secondary: "bg-secondary shadow-lg shadow-secondary/20",
    outline: "bg-transparent border border-border",
    ghost: "bg-transparent",
  };

  const sizes = {
    sm: "h-10 py-2",
    md: "h-14 py-3",
    lg: "h-16 py-4",
  };

  const textStyles = {
    primary: "text-white font-bold",
    secondary: "text-white font-bold",
    outline: "text-white font-semibold",
    ghost: "text-white/60 font-semibold",
  };

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={`${textStyles[variant]} ${textSize[size]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
