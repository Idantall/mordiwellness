import React, { useState } from 'react';
import { View, Pressable, Text, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from 'expo-av';

interface VideoScreenProps {
    videoUri: string;
    onNext: () => void;
}

const VideoScreen: React.FC<VideoScreenProps> = ({ videoUri, onNext }) => {
    const size = useWindowDimensions();
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if ('error' in status) {
            console.error(status.error);
            setIsError(true);
            setIsLoading(false);
        } else if (status.isLoaded) {
            setIsLoading(false);
            if (status.didJustFinish) {
                onNext();
            }
        }
    };

    return (
        <View className={`w-full h-full flex-1 bg-white mt-12`}>
            {isLoading && !isError && (
                <View className={`absolute inset-0 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            )}
            {isError && (
                <Text className={`text-red-500 text-lg font-bold`}>
                    שגיאה בטעינת הסרטון
                </Text>
            )}
            {!isError && (
                <ExpoVideo
                    source={{ uri: videoUri }}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    isLooping={false}
                    style={{ width: size.width, height: size.height }}
                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                />
            )}
            <Pressable
                className={`absolute top-5 right-5 bg-black/50 p-2 rounded`}
                onPress={onNext}
            >
                <Text className={`text-white underline text-lg font-bold`}>דלג</Text>
            </Pressable>
        </View>
    );
};

export default VideoScreen;
