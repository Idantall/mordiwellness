import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import Icon from 'react-native-vector-icons/Ionicons';
import { doesUserExist } from '@/firebase-config/firebase-auth';

export default function AuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const phoneSchema = z.string().regex(/^\+972\d{9}$/, 'טלפון נייד לא תקין');

  const convertPhoneNumber = (phone: string) => {
    if (phone.startsWith('05') && phone.length === 10) {
      return '+972' + phone.substring(1);
    }
    return phone;
  };

  const sendOtp = async () => {
    setLoading(true);
    try {
      const convertedPhoneNumber = convertPhoneNumber(phoneNumber)
      phoneSchema.parse(convertedPhoneNumber); // Validate phone number
      const userExists = await doesUserExist(convertedPhoneNumber);
      if (userExists) {
        const result = await auth().signInWithPhoneNumber(convertedPhoneNumber);
        router.push(`/auth/verify/${result.verificationId}`);
      } else {
        setError("משתמש עם מספר טלפון זה לא קיים")
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      } else {
        setError(error.message)
        console.error('Error sending OTP:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    backgroundColor: loading ? "lightgray" : 'white',
    textAlign: 'right',
    width: '75%',
    marginHorizontal: 'auto',
  };

  return (
    <View className='w-full min-h-screen'>
      <View className="flex-1 justify-center items-center gap-6">
        <Image style={{ width: 256, height: 256 }} source={require('assets/images/life-circle.png')} />
        <Text className="font-bold space-y-12 text-3xl">Mental Wellness</Text>
        <View className={`flex-row items-center`} style={inputStyle as any}>
          <Icon name="call-outline" size={24} color="gray" />
          <TextInput
            className="flex-1 ml-2"
            placeholder="טלפון נייד"
            keyboardType="phone-pad"
            textAlign='right'
            onChangeText={setPhoneNumber}
            value={phoneNumber}
            readOnly={loading}
          />
        </View>
        <Pressable className='px-4 py-4 bg-blue-700 rounded-md shadow disabled:bg-gray-600' onPress={sendOtp} disabled={loading}>
            <View className='flex flex-row justify-center items-center gap-2'>
                {loading && <ActivityIndicator color='white' />}
                <Text className='text-white font-bold text-lg'>שלח קוד</Text>
            </View>
        </Pressable>
        {error && <Text style={{ color: 'red', textAlign: "center", paddingHorizontal: 18, fontSize: 18 }}>{error}</Text>}
        <Pressable onPress={() => router.navigate("/auth/register")} className='px-4 py-2 bg-gray-200 rounded-md shadow'><Text className='text-gray-600 font-bold text-lg'>אין לך חשבון? לחץ כאן</Text></Pressable>
      </View>
    </View>
  );
}
