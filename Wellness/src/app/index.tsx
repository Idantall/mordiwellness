import { useCurrentUser } from "@/context/user-context";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import Spinner from "react-native-loading-spinner-overlay";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import "dayjs/locale/he";
// import app from "@/firebase-config/firebaseConfig";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.locale("he");

const IndexPage = () => {
  const { loading } = useCurrentUser();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  return (
    <View className="flex-1 justify-center items-center">
      <Spinner
        visible={loading}
        textContent={"רק רגע..."}
        color="blue"
        textStyle={{ color: "blue" }}
        overlayColor="white"
      />
    </View>
  );
};
export default IndexPage;
