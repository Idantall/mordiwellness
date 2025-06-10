import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

interface CustomPressableProps {
  onPress?: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  shadow?: boolean;
  style?: string;
}

const CustomPressable: React.FC<CustomPressableProps> = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  backgroundColor = 'bg-blue-700', // Default blue color
  textColor = 'text-white', // Default white text color
  borderRadius = 'rounded-md',
  shadow = true,
  style = '',
}) => {
  const pressableClasses = `px-4 py-2 ${backgroundColor} ${borderRadius} ${shadow ? 'shadow-md' : ''} ${style}`;
  const textClasses = `${textColor} font-bold text-center`;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${pressableClasses} ${disabled ? 'bg-gray-400' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text className={textClasses}>{title}</Text>
      )}
    </Pressable>
  );
};

export default CustomPressable;
