import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  textClassName = '',
}) => {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const handlePressIn = () => {
    if (disabled || isLoading || reducedMotion) return;
    scale.set(withTiming(0.97, { duration: 110, easing: EASE_OUT }));
  };

  const handlePressOut = () => {
    if (reducedMotion) return;
    scale.set(withTiming(1, { duration: 150, easing: EASE_OUT }));
  };

  const baseStyles = "rounded-2xl items-center justify-center flex-row px-6";

  const variants = {
    primary: "bg-primary shadow-lg shadow-primary/20",
    secondary: "bg-secondary shadow-lg shadow-secondary/20",
    outline: "bg-surface border border-border",
    ghost: "bg-transparent",
  };

  const sizes = {
    sm: "h-11 py-2",
    md: "h-14 py-3",
    lg: "h-16 py-4",
  };

  const textStyles = {
    primary: "text-white font-bold",
    secondary: "text-white font-bold",
    outline: "text-foreground font-semibold",
    ghost: "text-foreground/60 font-semibold",
  };

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      pressRetentionOffset={12}
      disabled={disabled || isLoading}
      style={animatedStyle}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#f59e0b' : '#fff'} />
      ) : (
        <Text className={`${textStyles[variant]} ${textSize[size]} ${textClassName}`}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
};
