import Slider from "@react-native-community/slider";
import { Pressable, View, Text } from "react-native";
import { CategoryDocument } from "types";
import { useState } from "react";

interface FirstGradeScreenProps {
    categories: CategoryDocument[];
    setUpdatedCategories: React.Dispatch<
        React.SetStateAction<CategoryDocument[]>
    >;
    setCurrentSelectedCategory: React.Dispatch<React.SetStateAction<number>>;
    setSliderValue: React.Dispatch<React.SetStateAction<number>>;
    currentSelectedCategory: number;
    sliderValue: number;
    handleNextCategory: () => void;
}

export default function FirstGradeScreen({
    categories,
    handleNextCategory,
    currentSelectedCategory,
    setSliderValue,
    sliderValue,
}: FirstGradeScreenProps) {
    return (
        <View className="w-full h-full flex-1 justify-center items-center p-4 bg-white">
            <Text className="text-lg font-semibold mb-4">
                מה מצב ה{categories[currentSelectedCategory].name} בחייך?
            </Text>
            <Slider
                style={{ width: 300, height: 40 }}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={sliderValue}
                onValueChange={setSliderValue}
            />
            <Text className="text-lg font-semibold mb-4">
                דירוג נוכחי: {sliderValue}
            </Text>
            <Pressable
                className="bg-blue-500 rounded-md px-4 py-2"
                onPress={handleNextCategory}
            >
                <Text className="text-white">אישור דירוג</Text>
            </Pressable>
        </View>
    );
}
