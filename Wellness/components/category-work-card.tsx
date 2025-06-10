import { CategoryDocument } from "@/types";
import { Text, View } from "react-native";
import CustomPressable from "./custom-pressable";
import { useState } from "react";
import Icon from 'react-native-vector-icons/FontAwesome6'

interface CategoryWorkCardProps {
    category: CategoryDocument
    handleDeActivateCategory: (categoryIndex: number) => Promise<void>
    index: number
}

export default function CategoryWorkCard({ category, handleDeActivateCategory, index }: CategoryWorkCardProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const deactivate = async () => {
        try {
            setLoading(true);
            await handleDeActivateCategory(index)
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return (
        <View className="p-4 mb-4 rounded-lg shadow bg-gray-100 border-l-4 border-blue-500 w-full">
            <View className="w-full flex flex-row justify-between items-center">
                <View className="flex-row justify-center items-center gap-4">
                    <Icon name={category.icon} size={24} />
                    <Text className="text-lg font-bold">{category.name}</Text>
                </View>
                <CustomPressable loading={loading} onPress={deactivate} title="סיום" />
            </View>
        </View>
    )
}
