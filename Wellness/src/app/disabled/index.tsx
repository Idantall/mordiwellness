import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';


const DisabledScreen: React.FC = () => {
  const colorScheme = useColorScheme();

  const handleContactPress = () => {
    Linking.openURL('mailto:support@wellness.com');
  };

  return (
    <SafeAreaView className={`flex-1 items-center justify-center ${colorScheme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <View className='p-4'>
        <Text className={`text-2xl font-bold text-center ${colorScheme === 'dark' ? 'text-white' : 'text-black'}`}>
          חשבון זה נחסם
        </Text>
        <Text className={`mt-4 text-lg text-center ${colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          לצערנו, חשבונך נחסם עקב הפרת תנאי השימוש שלנו.
        </Text>
        <Text className={`mt-2 text-lg text-center ${colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          אם אתה סבור שזו טעות, אנא צור קשר עם התמיכה שלנו.
        </Text>
        <TouchableOpacity onPress={handleContactPress} className='mt-6'>
          <Text className='text-blue-500 underline text-center'>
            צור קשר עם התמיכה
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DisabledScreen;
