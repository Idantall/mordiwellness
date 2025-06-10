import React, { useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { useWindowDimensions } from 'react-native';

const LifeCircleScreen: React.FC<{ onNext: () => Promise<void> }> = ({ onNext }) => {
    const [loading, setLoading] = useState(false);

    const { width, height } = useWindowDimensions();

    const handlePress = async () => {
        setLoading(true);
        try {
            console.log("Starting async operations");
            await onNext();
            console.log("Async operations completed");
        } catch (err) {
            console.error("Error during async operations", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ width, height }} className="flex-1 justify-between items-center bg-white p-6 ">
            <Text className="text-3xl font-bold text-center mt-20">הכירו את מעגל החיים</Text>
            <Image
                source={require('assets/images/life-circle.png')}
                style={{ width: '100%', height: '50%' }}
                resizeMode="contain"
            />
            <View className="w-full items-center">
                <Text className="text-lg text-center mb-4">
                    מעגל החיים מחולק ל-10 קטגוריות. לחץ או לחץ לחיצה ארוכה על משולש במעגל כדי לדרג מ-1 עד 5.
                </Text>
                <Pressable
                    className='bg-blue-700 w-full px-6 py-3 rounded-md shadow-md'
                    onPress={handlePress}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text className='text-white font-bold text-center'>למסך הראשי</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
};

export default LifeCircleScreen;
