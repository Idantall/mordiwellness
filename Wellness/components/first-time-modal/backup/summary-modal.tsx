import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Importing Ionicons
import { SummaryInfo } from 'types';

interface SummaryScreenProps {
    summaryInfo: SummaryInfo[];
    onNext: () => void;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ onNext, summaryInfo }) => {
    const renderSummary = (info: SummaryInfo, index: number) => (
        <View key={index} className="mb-4 p-4 bg-white rounded-md shadow">
            <Text className="text-xl font-semibold">שאלה: {info.question.text}</Text>
            <Text className="text-lg">קטגוריה: {info.question.categoryName}</Text>
            <Text className="text-lg">תשובה נבחרה: {info.selctedOption.text}</Text>
            <Text className="text-lg">דירוג: {info.selctedOption.grade}</Text>
        </View>
    );

    return (
        <View className="w-full h-full flex-1 bg-gray-200 p-8">
            <ScrollView className="flex-1 mt-10">
                <View className="items-center">
                    <Icon name="checkmark-circle-outline" size={50} color="#000" className="mb-4" />
                    <Text className="text-3xl font-bold mb-6 text-center">סיכום</Text>
                    <Text className="text-lg text-center mb-4">תודה שענית על השאלות. התוצאות מוצגות לפנייך:</Text>
                </View>
                {summaryInfo.map(renderSummary)}
            </ScrollView>
            <Text className='p-2 text-center text-lg'>במסך הבא יוצג בפנייך סרטון הדרכה</Text>
            <Pressable
                className="bg-blue-700 w-full px-4 py-4 rounded-md flex-row items-center justify-center mb-10"
                onPress={() => {
                    onNext();
                }}
            >
                <Icon name="arrow-back" size={20} color="#FFF" className="mr-2" />
                <Text className="text-white font-bold text-center">מעבר לסרטון ההדרכה</Text>
            </Pressable>
        </View>
    );
};

export default SummaryScreen;
