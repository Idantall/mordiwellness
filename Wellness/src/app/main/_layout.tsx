import { useCurrentUser } from "@/context/user-context";
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Slot, usePathname, useRouter } from "expo-router";
import BottomNavbar from "components/core/bottom-navbar";
import Toast from "react-native-toast-message";
import FirstTimeModal from "components/first-time-modal/first-time-modal";
import { ArchievedGrade, CategoryDocument } from "types";
import Header from "components/core/header";
import { createArchivedGrade } from "@/firebase-config/firebase-history";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
import NotificationModal from "components/notification-modal";
import { getNowDJ } from "@/utils/dates";

export default function Layout() {
  const {
    currentUser,
    markUserAsNotNew,
    updateCategoriesOnFireStore,
    updateCategoriesOnState,
    registerFCMToken,
  } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const [headerLabel, setHeaderLabel] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] =
    useState<boolean>(false);
  const [notificationModal, setNotificationModal] = useState<boolean>(false);
  const [notificationToDisplay, setNotificationToDisplay] = useState<{
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  } | null>(null);

  useEffect(() => {
    function changeHeaderLabel() {
      switch (pathname) {
        case "/main":
          setHeaderLabel("גלגל החיים שלי");
          break;
        case "/main/progress":
          setHeaderLabel("ההתקדמות שלי");
          break;
        case "/main/mood":
          setHeaderLabel("מצב הרוח שלי");
          break;
        case "/main/settings":
          setHeaderLabel("החשבון שלי");
          break;
        default:
          setHeaderLabel("");
      }
    }
    changeHeaderLabel();
  }, [pathname]);

  useEffect(() => {
    if (currentUser?.new) {
      setShowModal(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.disabled) {
      router.push("/disabled");
    }
  }, [currentUser, router]);

  async function requestNotificationsPermissions() {
    const result = await Notifications.requestPermissionsAsync();
    setNotificationPermission(result.granted);
    if (result.granted) {
      await requestAndRegisterFirebaseMessagingToken();
    } else {
      console.warn("Notifications are not permitted by device!");
    }
  }

  async function requestAndRegisterFirebaseMessagingToken() {
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
  }

  useEffect(() => {
    if (currentUser) {
      requestNotificationsPermissions();
    }
  }, [currentUser]);

  useEffect(() => {
    if (notificationPermission) {
      const subscription =
        Notifications.addNotificationResponseReceivedListener(
          (notificationEvent) => {
            const notificationContent =
              notificationEvent.notification.request.content;
            setNotificationModal(true);
            setNotificationToDisplay({
              title: notificationContent.title,
              body: notificationContent.body,
              data: notificationContent.data as Record<string, unknown>,
            });
          }
        );

      requestNotificationsPermissions();

      return () => {
        subscription.remove();
      };
    }
  }, [notificationPermission]);

  useEffect(() => {
    if (notificationPermission && currentUser) {
      const foregroundSubscription = messaging().onMessage(
        async (remoteMessage) => {
          setNotificationModal(true);
          setNotificationToDisplay({
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            data: remoteMessage.data,
          });
        }
      );

      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        setNotificationModal(true);
        setNotificationToDisplay({
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        });
      });

      const tokenRefreshSubscription = messaging().onTokenRefresh(
        async (token) => {
          if (currentUser.fcmToken !== token) {
            await registerFCMToken(token);
          }
        }
      );

      requestNotificationsPermissions();

      return () => {
        foregroundSubscription();
        tokenRefreshSubscription();
      };
    }
  }, [notificationPermission, currentUser]);

  const closeNotificationModal = () => {
    setNotificationModal(false);
    setNotificationToDisplay(null);
  };

  const handleCloseModal = async () => {
    await markUserAsNotNew();
    setShowModal(false);
  };

  const archieveGrades = async (updatedCategories: CategoryDocument[]) => {
    if (!currentUser) return;
    for (const updatedCategory of updatedCategories) {
      const archiveProps: Partial<ArchievedGrade> = {
        name: updatedCategory.name,
        type: "category",
        icon: updatedCategory.icon,
        color: updatedCategory.color,
        grade: updatedCategory.grade,
        gradedAt: getNowDJ().toDate(),
        userId: currentUser.id,
      };
      await createArchivedGrade(archiveProps as ArchievedGrade);
    }
  };

  const handleUpdateCategories = async (
    updatedCategories: CategoryDocument[]
  ) => {
    try {
      updateCategoriesOnState(updatedCategories);
      await updateCategoriesOnFireStore(updatedCategories);
      await archieveGrades(updatedCategories);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "אוי לא!",
        text2: "שגיאה בעת דירוג הקטגוריה!",
      });
      console.error("Error updating category:", err);
    }
  };

  return (
    <View className="flex-1 bg-white pt-32">
      {headerLabel && <Header label={headerLabel} />}
      <View className="flex-1">
        <Slot />
      </View>

      <Toast position="top" topOffset={100} />
      <BottomNavbar />
      {showModal && currentUser && (
        <FirstTimeModal
          categories={currentUser.categories}
          handleUpdateCategories={handleUpdateCategories}
          handleCloseModal={handleCloseModal}
          showModal={showModal}
        />
      )}
      <NotificationModal
        isVisible={notificationModal}
        onClose={closeNotificationModal}
        notification={notificationToDisplay}
      />
    </View>
  );
}
