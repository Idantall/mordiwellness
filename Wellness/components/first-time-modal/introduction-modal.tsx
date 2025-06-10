import React from "react";
import { View, Text, Pressable } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface IntroductionScreenProps {
  onNext: () => void;
}

const IntroductionScreen: React.FC<IntroductionScreenProps> = ({ onNext }) => {
  return (
    <View className="w-full h-full flex-1 justify-between bg-white p-8">
      <View className="flex-1 justify-start items-center mt-10">
        <Icon
          name="information-circle-outline"
          size={50}
          color="#000"
          className="mb-4"
        />
        <Text className="text-2xl font-bold text-center mb-4">
          לפניי שנסביר לך איך הכל עובד
        </Text>
        <Text className="text-lg text-center mb-4">
          אנא ענה על השאלות הבאות כדי לקבל דירוג במעגל החיים ולהתחיל במסע השיפור
          שלך
        </Text>
      </View>
      <Pressable
        className="bg-blue-700 w-full px-4 py-2 rounded-md flex-row items-center justify-center mb-10"
        onPress={onNext}
      >
        <Icon name="arrow-back" size={20} color="#FFF" className="mr-2" />
        <Text className="text-white font-bold text-center">התחל</Text>
      </Pressable>
    </View>
  );
};

export default IntroductionScreen;
