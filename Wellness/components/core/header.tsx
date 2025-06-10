import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Switch,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import AnimatedWindow from "./custom-window";
import { signOut } from "@/firebase-config/firebase-auth";
import { useRouter } from "expo-router";
import { version } from "package.json";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
import { useCurrentUser } from "@/context/user-context";
import ContactLottie from "@/components/lotties/contact-lottie";

interface HeaderProps {
  label: string;
  showMenu?: boolean;
  showLogo?: boolean;
  showBorder?: boolean;
}

interface MenuItem {
  icon: string;
  title: string;
  content: React.ReactNode;
}

export default function Header({
  label,
  showMenu = true,
  showBorder = true,
  showLogo = true,
}: HeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { currentUser, registerFCMToken } = useCurrentUser();

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const settings = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(settings.granted);
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      alert("ההתראות נועדו לסייע לך לעמוד ביעדיך. אם בכל זאת אינך מעוניין בהם. לחץ על הכפתור");
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        await requestAndRegisterFirebaseMessagingToken();
        setNotificationsEnabled(true);
      } else {
        console.warn("Notifications are not permitted by device!");
      }
    }
  };

  const requestAndRegisterFirebaseMessagingToken = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled && currentUser) {
      try {
        const messagingToken = await messaging().getToken();
        if (!currentUser.fcmToken || currentUser.fcmToken !== messagingToken) {
          await registerFCMToken(messagingToken);
          console.log("FCM token registered successfully");
        }
      } catch (error) {
        console.error("Error registering FCM token:", error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const menuItems: MenuItem[] = [
    {
      icon: "document-text-outline",
      title: "תנאי שימוש ומדיניות פרטיות",
      content: <Text>תוכן תנאי שימוש ומדיניות פרטיות</Text>,
    },
    {
      icon: "book-outline",
      title: "מסמכי הסבר",
      content: <Text>תוכן מסמכי הסבר</Text>,
    },
    {
      icon: "mail-outline",
      title: "צור קשר",
      content: (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-4xl font-bold mb-2 mt-12">צור קשר</Text>
          <Text className="text-xl mt-4">ליצירת קשר שלח מייל אל:</Text>
          <Pressable
            onPress={() => Linking.openURL("mailto:mwbedri@gmail.com")}
          >
            <Text className="text-lg underline text-blue-700">
              mwbedri@gmail.com
            </Text>
          </Pressable>
          <ContactLottie />
        </View>
      ),
    },
    {
      icon: "information-circle-outline",
      title: "אודות",
      content: <Text>תוכן אודות</Text>,
    },
    {
      icon: "settings-outline",
      title: "הגדרות",
      content: (
        <View>
          <Text className="text-lg mb-4">הגדרות התראות</Text>
          <View className="flex-row justify-between items-center">
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={notificationsEnabled ? "#f5dd4b" : "#f4f3f4"}
            />
            <Text>אפשר התראות</Text>
          </View>
        </View>
      ),
    },
    {
      icon: "share-social-outline",
      title: "שתף אפליקציה",
      content: <Text>תוכן שתף אפליקציה</Text>,
    },
  ];

  const Logo = require("assets/images/app/logo.png");

  return (
    <>
      <SafeAreaView className="absolute top-0 left-0 z-50 right-0 bg-white">
        <View
          className={`flex-row justify-between items-center py-4 px-4 bg-white ${showBorder && "border-b-2 border-gray-100"}`}
        >
          {showLogo ? <Image source={Logo} width={12} height={12} className="w-12 h-12" /> : <View className="w-6" />}
          <Text className="text-xl font-bold">{label}</Text>
          {showMenu && (
            <Pressable onPress={() => setMenuVisible(true)}>
              <Icon name="menu-outline" size={24} color="black" />
            </Pressable>
          )}
          {!showMenu && <View className="w-6" />}
        </View>
      </SafeAreaView>

      <AnimatedWindow
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        animationConfig={{ slide: true, slideDirection: "right" }}
      >
        <ScrollView
          style={{ width }}
          className="bg-white"
          contentContainerClassName="p-5 w-full h-full"
        >
          <Text className="text-2xl font-bold mb-5 text-blue-700 text-right">
            תפריט
          </Text>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              className="flex-row items-center py-4 border-b border-gray-200"
              onPress={() => {
                setActiveWindow(item.title);
                setMenuVisible(false);
              }}
            >
              <Icon
                name={item.icon}
                size={24}
                color="#1D4ED8"
                className="ml-4"
              />
              <Text className="text-lg text-gray-800 text-right flex-1">
                {item.title}
              </Text>
            </Pressable>
          ))}
          <Pressable
            className="flex-row items-center justify-center bg-red-500 py-4 px-6 rounded-lg mt-6"
            onPress={handleSignOut}
          >
            <Icon
              name="log-out-outline"
              size={24}
              color="white"
              className="mr-2"
            />
            <Text className="text-lg font-bold text-white">התנתק</Text>
          </Pressable>
          <Text className="text-sm text-gray-500 text-center mt-4">
            גרסה {version}
          </Text>
        </ScrollView>
      </AnimatedWindow>

      {menuItems.map((item, index) => (
        <AnimatedWindow
          key={index}
          visible={activeWindow === item.title}
          onClose={() => setActiveWindow(null)}
          animationConfig={{ slide: true, slideDirection: "right" }}
        >
          <ScrollView
            style={{ width }}
            className="bg-white"
            contentContainerClassName="p-5 w-full h-full"
          >
            <Text className="text-2xl font-bold mb-5 text-blue-700 text-right">
              {item.title}
            </Text>
            {item.content}
          </ScrollView>
        </AnimatedWindow>
      ))}
    </>
  );
}
