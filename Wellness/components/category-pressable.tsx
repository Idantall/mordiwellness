import React from 'react';
import { View, Text, Pressable } from 'react-native';
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';
import { CategoryDocument } from 'types';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

interface CategoryPressableProps {
    category: CategoryDocument,
    index: number,
    handleSelect: (category: CategoryDocument) => void;
}

export default function CategoryPressable({ category, index, handleSelect }: CategoryPressableProps) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
        opacity.value = withTiming(0.7, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
        opacity.value = withTiming(1, { duration: 100 });
    };

    return (
        <View key={index} className="p-2">
            <Pressable
                onPress={() => handleSelect(category)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <Animated.View style={animatedStyle} className="flex justify-center items-center h-24">
                    <FontAwesome6Icon name={category.icon} size={40} className="text-blue-500 mb-2" />
                    <Text className="font-bold text-lg text-center text-gray-800">{category.name}</Text>
                </Animated.View>
            </Pressable>
        </View>
    );
}
