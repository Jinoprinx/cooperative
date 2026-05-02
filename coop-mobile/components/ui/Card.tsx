import React from 'react';
import { View, Text, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', ...props }) => {
  return (
    <View 
      className={`bg-surface border border-border rounded-[2.5rem] p-6 shadow-sm ${className}`}
      {...props}
    >
      {title && (
        <Text className="text-foreground/40 text-xs font-bold uppercase tracking-widest mb-4">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
};
