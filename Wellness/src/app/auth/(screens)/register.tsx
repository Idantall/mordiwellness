import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  Pressable,
  ActivityIndicator,
  Switch,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import Toast from "react-native-toast-message";
import { Link, useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import citiesJson from "assets/data/cities.json";
import { AccountRegisterCredentionals } from "types";
import { z } from "zod";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import SelectDropdown from "react-native-select-dropdown";

const RegisterScreen: React.FC = () => {
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  const [agreedToTermsAndConditions, setAgreedToTermsAndConditions] =
    useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const router = useRouter();

  const cities = citiesJson
    .map((city) => city)
    .sort((a, b) => a.localeCompare(b, "he"));

  const displayNameSchema = z.string().min(1, "שם תצוגה הוא שדה חובה");
  const phoneSchema = z
    .string()
    .regex(/^\+972\d{9}$/, "מספר טלפון צריך להתחיל ב +972 ולכלול 9 ספרות");
  const citySchema = z.string().min(1, "עיר היא שדה חובה");
  const ageSchema = z.number().min(1, "גיל הוא שדה חובה");
  const termsSchema = z
    .boolean()
    .refine((value) => value === true, "לא הסכמת לתנאים והגבלות");

  const convertPhoneNumber = (phone) => {
    if (phone.startsWith("05") && phone.length === 10) {
      return "+972" + phone.substring(1);
    }
    return phone;
  };

  const validateFields = () => {
    displayNameSchema.parse(displayName);
    phoneSchema.parse(convertPhoneNumber(phoneNumber));
    citySchema.parse(city);
    ageSchema.parse(age);
    termsSchema.parse(agreedToTermsAndConditions);
  };

  const saveCredentialsToStorage = async (
    credentials: AccountRegisterCredentionals
  ) => {
    try {
      await AsyncStorage.setItem(
        "userCredentials",
        JSON.stringify(credentials)
      );
    } catch (error) {
      console.error("Error saving credentials to storage", error);
    }
  };

  const register = async () => {
    setLoading(true);
    setError(null);
    try {
      validateFields();
      const convertedPhoneNumber = convertPhoneNumber(phoneNumber);
      const profilePictureUrl = profilePicture;
      const credentials: AccountRegisterCredentionals = {
        displayName,
        phoneNumber: convertedPhoneNumber,
        city,
        gender,
        agreedToTermsAndConditions,
        profilePictureUrl,
        age,
      };
      await saveCredentialsToStorage(credentials);
      const confirmation =
        await auth().signInWithPhoneNumber(convertedPhoneNumber);
      router.push(`/auth/verify/${confirmation.verificationId}`);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        console.error(err);
        const message: string = err.message;
        if (message.includes("auth/too-many-requests")) {
          setError(
            "עקב מספר מוגזם של בקשות נחסמה למספר זה הגישה לזמן מה, חזור מאוחר יותר!"
          );
        } else if (message.includes("auth/missing-client-identifier")) {
          setError("אפלקיציה לא מקורית או באג פנימי");
        } else {
          setError(err.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const selectProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const inputStyle = {
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "white",
    textAlign: "right",
    width: "75%",
    marginHorizontal: "auto",
  };

  return (
    <KeyboardAvoidingView className="w-full h-screen">
      <View className="flex-1 justify-center items-center gap-4 p-6">
        <Text className="text-3xl font-bold text-blue-500">הרשמה</Text>
        <Pressable onPress={selectProfilePicture}>
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          ) : (
            <View className="items-center">
              <Icon name="person-circle-outline" size={100} color="gray" />
              <Text>בחר תמונת פרופיל</Text>
            </View>
          )}
        </Pressable>
        <View className="flex-row items-center" style={inputStyle as any}>
          <Icon name="person-outline" size={24} color="gray" />
          <TextInput
            className="flex-1 ml-2 bg-white"
            placeholder="שם תצוגה"
            onChangeText={setDisplayName}
            textAlign="right"
            value={displayName}
          />
        </View>
        <View className="flex-row items-center" style={inputStyle as any}>
          <Icon name="call-outline" size={24} color="gray" />
          <TextInput
            className="flex-1 ml-2 bg-white"
            placeholder="טלפון נייד"
            keyboardType="phone-pad"
            textAlign="right"
            onChangeText={setPhoneNumber}
            value={phoneNumber}
          />
        </View>
        <SelectDropdown
          data={cities}
          onSelect={(selectedItem) => setCity(selectedItem)}
          dropdownStyle={{
            backgroundColor: "white",
            borderRadius: 6,
            marginBottom: 24,
          }}
          renderButton={(selectedItem) => (
            <View style={{ ...inputStyle, paddingVertical: 6 } as any}>
              <Text
                style={{
                  textAlign: "right",
                  color: selectedItem ? "black" : "gray",
                }}
              >
                {selectedItem || "בחר עיר"}
              </Text>
              <Icon name="chevron-down" size={20} color="gray" />
            </View>
          )}
          renderItem={(item) => (
            <View style={{ paddingVertical: 10, paddingHorizontal: 20 }}>
              <Text style={{ textAlign: "right", fontSize: 16 }}>{item}</Text>
            </View>
          )}
          search
          searchPlaceHolder="חפש את העיר שלך.."
          searchInputStyle={{ direction: "rtl" }}
        />
        <SelectDropdown
          data={[...Array(99)].map((_, i) => i + 1)}
          onSelect={(selectedItem) => setAge(selectedItem)}
          dropdownStyle={{ backgroundColor: "white", borderRadius: 6 }}
          renderButton={(selectedItem) => (
            <View style={{ ...inputStyle, paddingVertical: 6 } as any}>
              <Text
                style={{
                  textAlign: "right",
                  color: selectedItem ? "black" : "gray",
                }}
              >
                {selectedItem ? `גיל: ${selectedItem}` : "בחר גיל"}
              </Text>
              <Icon name="chevron-down" size={20} color="gray" />
            </View>
          )}
          renderItem={(item) => (
            <View style={{ paddingVertical: 10, paddingHorizontal: 20 }}>
              <Text style={{ textAlign: "right", fontSize: 16 }}>{item}</Text>
            </View>
          )}
        />
        <Text>אני מזדהה כ:</Text>
        <View className="flex-row gap-4">
          <Pressable
            className={`px-4 py-2 rounded-full ${gender === "male" ? "bg-blue-500" : "bg-gray-300"}`}
            onPress={() => setGender("male")}
          >
            <Text className="text-white font-bold">זכר</Text>
          </Pressable>
          <Pressable
            className={`px-4 py-2 rounded-full ${gender === "female" ? "bg-blue-500" : "bg-gray-300"}`}
            onPress={() => setGender("female")}
          >
            <Text className="text-white font-bold">נקבה</Text>
          </Pressable>
          <Pressable
            className={`px-4 py-2 rounded-full ${gender === "other" ? "bg-blue-500" : "bg-gray-300"}`}
            onPress={() => setGender("other")}
          >
            <Text className="text-white font-bold">אחר</Text>
          </Pressable>
        </View>
        <View className="flex-row items-center">
          <Text
            style={{ color: "blue", textDecorationLine: "underline" }}
            onPress={() => setModalVisible(true)}
          >
            תנאים והגבלות
          </Text>
          <Text>הסכמתי ל</Text>
          <Switch
            value={agreedToTermsAndConditions}
            onValueChange={setAgreedToTermsAndConditions}
            trackColor={{ false: "gray", true: "blue" }}
            thumbColor={agreedToTermsAndConditions ? "white" : "white"}
          />
        </View>
        {error && (
          <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
        )}
        <Pressable
          className="p-4 bg-blue-700 rounded-md shadow-md"
          onPress={register}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">הרשמה</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => router.navigate("/auth")}
          className="px-4 py-2 bg-gray-200 rounded-md shadow"
        >
          <Text className="text-lg text-gray-600 font-bold">
            כבר יש לך חשבון? לחץ כאן
          </Text>
        </Pressable>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="w-full h-full justify-center bg-white">
          <ScrollView className="bg-white m-8 p-6">
            <Text className="text-lg font-bold mb-4">תנאים והגבלות</Text>
            <Text>
              אנא קרא את התנאים וההגבלות הללו בעיון לפני השימוש באפליקציה. ...
            </Text>
            <Pressable
              className="p-4 bg-blue-700 rounded-md shadow-md mt-4"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white font-bold text-center">סגור</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
