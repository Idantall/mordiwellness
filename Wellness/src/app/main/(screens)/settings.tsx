import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Text,
  View,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import * as ImagePicker from "expo-image-picker";
import citiesJson from "assets/data/cities.json";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { useCurrentUser } from "@/context/user-context";
import Icon from "react-native-vector-icons/Ionicons";
import { updateCurrentUser } from "@/firebase-config/firebase-auth";
import { FirebaseError } from "firebase/app";

const schema = z.object({
  displayName: z.string().min(1, "שם תצוגה הוא שדה חובה"),
  city: z.string().min(1, "עיר היא שדה חובה"),
  age: z.number().min(1, "גיל הוא שדה חובה").max(120, "גיל לא תקין"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "מגדר הוא שדה חובה",
  }),
  profilePictureUrl: z.union([z.string().url(), z.string().min(0).max(0)]),
});

interface UserState extends z.infer<typeof schema> {}

export default function SettingsScreen() {
  const { currentUser, updateCredentialsOnState, updateUserAgeCategories } =
    useCurrentUser();
  const [userState, setUserState] = useState<UserState>({
    displayName: currentUser?.displayName || "",
    city: currentUser?.city || "",
    gender: currentUser?.gender || "male",
    age: currentUser?.age || null,
    profilePictureUrl: currentUser?.profilePictureUrl || null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cities = useMemo(
    () => citiesJson.sort((a, b) => a.localeCompare(b, "he")),
    []
  );

  const updateField = useCallback((field: keyof UserState, value: any) => {
    setUserState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const selectProfilePicture = useCallback(async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "הרשאה נדרשת",
          "אנו זקוקים להרשאת גישה לגלריה כדי לבחור תמונת פרופיל."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        updateField("profilePictureUrl", result.assets[0].uri);
      }
    } catch (err) {
      console.error("Error selecting profile picture:", err);
      Alert.alert("שגיאה", "אירעה שגיאה בבחירת תמונת הפרופיל. אנא נסה שוב.");
    }
  }, [updateField]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure all fields are filled
      if (
        !userState.displayName ||
        !userState.city ||
        !userState.age ||
        !userState.gender
      ) {
        throw new Error("כל השדות הם חובה. אנא מלא את כל הפרטים.");
      }

      // Handle the case where profilePictureUrl might be null
      const validatedData = schema.parse({
        ...userState,
        profilePictureUrl: userState.profilePictureUrl || "",
      });

      const { id, ...resultCredentials } = await updateCurrentUser({
        ...validatedData,
        id: currentUser.id,
        profilePictureUrl: validatedData.profilePictureUrl || "",
      });

      updateUserAgeCategories(validatedData.age);

      updateCredentialsOnState(resultCredentials);

      Toast.show({
        type: "success",
        text1: "הצלחה",
        text2: "נתוניך עודכנו במערכת!",
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof FirebaseError) {
        setError(`שגיאת Firebase: ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("אירעה שגיאה לא צפויה");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "white",
    textAlign: "right" as const,
    width: "100%",
    marginHorizontal: "auto",
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 justify-center items-center gap-4 p-6">
        <Text className="text-3xl font-bold text-blue-500">הגדרות</Text>
        <Pressable disabled={loading} onPress={selectProfilePicture}>
          {userState.profilePictureUrl ? (
            <Image
              source={{ uri: userState.profilePictureUrl }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
              }}
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
            editable={!loading}
            className="flex-1 ml-2 bg-white"
            placeholder="שם תצוגה"
            onChangeText={(value) => updateField("displayName", value)}
            textAlign="right"
            value={userState.displayName}
          />
        </View>
        <SelectDropdown
          data={cities}
          onSelect={(selectedItem) => updateField("city", selectedItem)}
          defaultValue={userState.city}
          disabled={loading}
          dropdownStyle={{
            backgroundColor: "white",
            borderRadius: 6,
            marginBottom: 24,
          }}
          renderButton={(selectedItem) => (
            <View
              style={{
                ...(inputStyle as any),
                paddingVertical: 6,
              }}
            >
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
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
            >
              <Text style={{ textAlign: "right", fontSize: 16 }}>{item}</Text>
            </View>
          )}
          search
          searchPlaceHolder="חפש את העיר שלך.."
          searchInputStyle={{ direction: "rtl" }}
        />
        <SelectDropdown
          data={[...Array(100)].map((_, i) => i + 1)}
          onSelect={(selectedItem) => updateField("age", selectedItem)}
          defaultValue={userState.age}
          disabled={loading}
          dropdownStyle={{
            backgroundColor: "white",
            borderRadius: 6,
          }}
          renderButton={(selectedItem) => (
            <View
              style={{
                ...(inputStyle as any),
                paddingVertical: 6,
              }}
            >
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
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
            >
              <Text style={{ textAlign: "right", fontSize: 16 }}>{item}</Text>
            </View>
          )}
        />
        <Text>אני מזדהה כ:</Text>
        <View className="flex-row gap-4 w-full">
          <Pressable
            className={`flex-1 px-4 py-2 rounded-md ${userState.gender === "male" ? "bg-blue-700" : "bg-gray-300"}`}
            onPress={() => updateField("gender", "male")}
            disabled={loading}
          >
            <Text className="text-white font-bold text-center">זכר</Text>
          </Pressable>
          <Pressable
            className={`flex-1 px-4 py-2 rounded-md ${userState.gender === "female" ? "bg-blue-700" : "bg-gray-300"}`}
            onPress={() => updateField("gender", "female")}
            disabled={loading}
          >
            <Text className="text-white font-bold text-center">נקבה</Text>
          </Pressable>
          <Pressable
            className={`flex-1 px-4 py-2 rounded-md ${userState.gender === "other" ? "bg-blue-700" : "bg-gray-300"}`}
            onPress={() => updateField("gender", "other")}
            disabled={loading}
          >
            <Text className="text-white font-bold text-center">אחר</Text>
          </Pressable>
        </View>
        <Pressable
          disabled={loading}
          onPress={handleSave}
          className={`py-3 rounded-lg ${loading ? "bg-gray-400" : "bg-blue-700"}`}
          style={{ width: "100%" }}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              שמירה
            </Text>
          )}
        </Pressable>
        {error && <Text style={{ color: "red" }}>{error}</Text>}
      </View>
    </ScrollView>
  );
}
