import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

interface IconLinkProps {
    name: string;
    label: string;
    route: string;
    filledName: string;
  }

  const IconLink: React.FC<IconLinkProps> = ({ name, label, route, filledName }) => {
    const router = useRouter();
    const currentPath = usePathname();
    const iconName = currentPath === route ? filledName : name;

    // Animated value for the bounce effect
    const bounceValue = useRef(new Animated.Value(1)).current;
    const scaleValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (currentPath === route) {
        // Trigger the bounce animation
        Animated.sequence([
          Animated.timing(bounceValue, {
            toValue: -4,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bounceValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        Animated.sequence([
            Animated.timing(scaleValue, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start()
      }
    }, [currentPath, route, bounceValue]);


    return (
      <Pressable onPress={() => router.push(route)} className="relative items-center w-1/4 h-full">
        <Animated.View style={{ transform: [{ translateY: bounceValue }], zIndex: 40 }}>
          <Icon className='transition-all' name={iconName} size={24} color="#1D4ED8" />
        </Animated.View>
        <Animated.View className={`w-20 h-16 rounded-3xl bg-opacity-80 bg-gray-100 absolute top-[-10px] ${currentPath === route ? "block" : "hidden"}`} style={{ transform: [{ scale: scaleValue }] }} />
        <Text className="text-xs text-blue-700 font-bold">{label}</Text>
      </Pressable>
    );
  };


const BottomNavbar: React.FC = () => {
    return (
        <View className="flex-row justify-around items-center bg-white py-4 shadow-md fixed bottom-0 w-full z-50 border-2 border-gray-100 rounded-t-2xl">
            <IconLink route='/main' name='home-outline' filledName='home' label='בית' />
            <IconLink route='/main/progress' name='bar-chart-outline' filledName='bar-chart' label='התקדמות' />
            <IconLink route='/main/mood' name='happy-outline' filledName='happy' label='מצב רוח'/>
            <IconLink route='/main/settings' name='settings-outline' filledName='settings' label='הגדרות' />
        </View>
    );
};


export default BottomNavbar;
