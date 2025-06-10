import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface QuestionProps {
    question: {
        text: string;
        options: {
            text: string;
            grade: number;
        }[];
    };
    selectedOption: any;
    onSelectOption: (option: any) => void;
    onNext: () => void;
    error: string | null;
}

const QuestionStep: React.FC<QuestionProps> = ({ question, selectedOption, onSelectOption, onNext, error }) => {
    return (
        <View className="flex-1 justify-center items-center w-full p-8 bg-gray-200">
            <Text className="text-3xl font-bold mb-8 text-center text-black">{question.text}</Text>
            <View className="w-full">
                {question.options.map((option, index) => (
                    <Pressable
                        key={index}
                        className={`w-full py-4 mb-4 rounded-md shadow-md ${selectedOption === option ? 'bg-blue-500' : 'bg-white'}`}
                        onPress={() => onSelectOption(option)}
                        style={{ alignItems: 'center' }}
                    >
                        <Text className={`text-lg font-bold text-center ${selectedOption === option ? 'text-white' : 'text-blue-700'}`}>{option.text}</Text>
                    </Pressable>
                ))}
            </View>
            {error && <Text className="text-red-500 mb-4">{error}</Text>}
            <Pressable className="bg-blue-700 w-full px-6 py-3 mt-8 rounded-md shadow-md" onPress={onNext}>
                <Text className="text-white font-bold text-center">הבא</Text>
            </Pressable>
        </View>
    );
};

export default QuestionStep;
