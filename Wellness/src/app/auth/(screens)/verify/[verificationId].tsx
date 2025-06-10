import React, { useState } from 'react';
import { View, TextInput, Text, ActivityIndicator, Pressable,Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';

export default function VerifyScreen() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { verificationId } = useLocalSearchParams<{ verificationId: string }>();

  const otpSchema = z.string().length(6, 'הקוד אמור להכיל בתוכו כ6 ספרות');

  const verifyOtp = async () => {
    if (!verificationId) {
      setError('אין לך הרשאה לשים קוד');
      return;
    }

    try {
      setLoading(true);
      otpSchema.parse(otp);
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      await auth().signInWithCredential(credential);
      router.push('/main');
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('קוד לא תקין');
      }
      console.error('אירע שגיאה בעת אישור הקוד:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToMain = () => {
    router.push('/auth');
  };

  return (
    <View className="w-full h-full flex-1 justify-center items-center space-y-4 gap-y-4">
      <Pressable onPress={navigateToMain} style={{ position: 'absolute', top: 40, left: 20 }}>
        <Icon name="arrow-back" size={30} color="blue" />
      </Pressable>
      <Image className='w-48 h-48' source={require('assets/images/life-circle.png')} />
      <Text className='text-5xl font-bold space-y-12'>Mental Wellness</Text>
      <Text className='text-lg text-center'>נשלח קוד אימות בSMS למספר הטלפון שלך</Text>
      <TextInput
        className="read-only::bg-gray-600 border rounded p-2 w-3/4"
        placeholder="הזן קוד"
        onChangeText={setOtp}
        value={otp}
        keyboardType="number-pad"
        readOnly={loading}
        maxLength={6}
      />
      <Pressable className='p-4 bg-blue-700 rounded-md shadow-md disabled:bg-gray-600' onPress={verifyOtp} disabled={loading}>
        <View className='flex flex-row justify-center items-center gap-2'>
            <Text className='text-white font-bold'>אישור קוד</Text>
            {loading && <ActivityIndicator color='white' />}
        </View>
      </Pressable>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
}
