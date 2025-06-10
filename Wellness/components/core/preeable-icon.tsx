import React, { useRef } from 'react';
import { Pressable, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6'; // Change this import if you use other icon sets

interface PressableIconProps {
  name: string; // Icon name
  size?: number; // Icon size
  color?: string; // Icon color
  onPress: () => Promise<void> | void; // Press handler function
}

const PressableIcon: React.FC<PressableIconProps> = ({
  name,
  size = 24,
  color = 'black',
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9, // Scale down on press
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, // Scale back to normal on release
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={async () => await onPress()}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon name={name} size={size} color={color} />
      </Animated.View>
    </Pressable>
  );
};

export default PressableIcon;
