import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import {
  ArchievedMoodStatistic,
  MoodEmoji,
  MoodEntry,
  // MoodStatistic,
  TimePeriod,
} from "types";
import MoodMeter from "@/components/svg/mood-meter";
import { useCurrentUser } from "@/context/user-context";
import AnimatedWindow from "components/core/custom-window";
import { useMoodStatistics } from "@/hooks/useMoodStatistics";
import { useMoodHistory } from "@/hooks/useMoodHistory";
// import {
//   filterEntriesByPeriod,
//   getStartDate as getPeriodStartDate,
// } from "@/utils/dates";
import { useWindowDimensions } from "react-native";
import MoodLineChart from "@/components/svg/charts/mood-line-chart";
import useInitialMockEmojis from "@/hooks/useInitialMockEmojis";
import ViewShot, { captureRef } from "react-native-view-shot";
import { shareAsync } from "expo-sharing";
import IconComponent from "react-native-vector-icons/FontAwesome6";
import Spinner from "react-native-loading-spinner-overlay";

export default function MoodScreen() {
  const { currentUser, updateCurrentMood } = useCurrentUser();
  const [currentMood, setCurrentMood] = useState<MoodEmoji | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showIntroWindow, setShowIntroWindow] = useState<boolean>(false);
  const viewShotRef = useRef(null);
  const chartViewShotRef = useRef(null);

  const handleShare = async (target: "moodMeter" | "moodChart") => {
    try {
      const ref = target === "moodMeter" ? viewShotRef : chartViewShotRef;
      const uri = await captureRef(ref, {
        format: "jpg",
        quality: 1,
        width: 1400,
        height: 1080,
      });
      await shareAsync(uri, { mimeType: "image/jpeg" });
    } catch (error) {
      console.error("Error sharing the image", error);
      Toast.show({
        type: "error",
        text1: "שגיאה",
        text2: "אירעה שגיאה בעת שיתוף התמונה",
      });
    }
  };

  const {
    data: initialMockEmojis,
    isLoading: isInitialMockEmojisLoading,
    error: initialMockEmojisError,
  } = useInitialMockEmojis();

  const {
    data: moodHistory,
    isLoading: isMoodHistoryLoading,
    error: moodHistoryError,
    refetch: refetchMoodHistory,
    mutation: moodHistoryMutation,
  } = useMoodHistory({ userId: currentUser.id });
  const {
    data: moodStatistics,
    isLoading: isMoodStatisticsLoading,
    error: moodStatisticsError,
    refetch: refetchMoodStatistics,
    mutation: moodStatisticsMutation,
  } = useMoodStatistics({ userId: currentUser.id });
  
  const [error, setError] = useState<string | null>(null);
  const [_, setLocalMoodStatistics] = useState<ArchievedMoodStatistic[]>([]);
  const [localMoodHistory, setLocalMoodHistory] = useState<MoodEntry[]>([]);
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("day");
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.currentMood) {
      setCurrentMood(currentUser.currentMood);
    } else {
      setShowIntroWindow(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (moodStatistics) setLocalMoodStatistics(moodStatistics);
  }, [moodStatistics]);

  useEffect(() => {
    if (moodHistory) setLocalMoodHistory(moodHistory);
  }, [moodHistory]);

  useEffect(() => {
    if (initialMockEmojis) {
      initialMockEmojis.sort((a, b) => a.moodIndication - b.moodIndication);
    }
  }, [initialMockEmojis]);

  const handleMoodChange = async (newMood: MoodEmoji) => {
    try {
      setCurrentMood(newMood);
      setShowEmojiPicker(false);
      setShowIntroWindow(false);
      await updateCurrentMood(newMood);
      await moodStatisticsMutation.mutateAsync(newMood);
      await refetchMoodStatistics(); // Refetch mood statistics after updating mood
      await moodHistoryMutation.mutateAsync(newMood);
      await refetchMoodHistory(); // Refetch mood history after updating mood
      Toast.show({ type: "success", text1: "מצב רוח עודכן בהצלחה" });
    } catch (err) {
      setError("שגיאה בעדכון מצב הרוח");
      Toast.show({
        type: "error",
        text1: "שגיאה בעדכון מצב הרוח",
      });
    }
  };

  const periods: TimePeriod[] = [
    "day",
    "week",
    "month",
    "year",
    "1_month_ago",
    "2_months_ago",
    "3_months_ago",
    "ever",
  ];

  const periodLabels: Record<TimePeriod, string> = {
    day: "היום האחרון",
    week: "השבוע האחרון",
    month: "החודש האחרון",
    year: "השנה האחרונה",
    "1_month_ago": "לפני חודש",
    "2_months_ago": "לפני חודשיים",
    "3_months_ago": "לפני שלושה חודשים",
    ever: "היסטוריה",
  };

  if (isInitialMockEmojisLoading || isMoodHistoryLoading || isMoodStatisticsLoading) {
    return (
      <View className="w-full h-full flex flex-row justify-center items-center gap-2">
        <ActivityIndicator color={"blue"} />
        <Text>...טוען מידע</Text>
      </View>
    )
  }

  if (!isInitialMockEmojisLoading && !isMoodHistoryLoading && !isMoodStatisticsLoading) {
    return (
      <View className="w-full flex-1 bg-white">
        <ScrollView
          contentContainerClassName="justify-center items-center"
          className="w-screen flex-1 px-4 md:px-8"
        >
          {error && (
            <Text className="text-red-500 text-right mb-2 text-base md:text-lg">
              {error}
            </Text>
          )}
          <ViewShot
            ref={viewShotRef}
            options={{ format: "jpg", quality: 1 }}
            style={{ backgroundColor: "white" }}
          >
            <Text className="text-4xl md:text-6xl mb-2 font-extrabold text-center mt-4">
              מד המצב רוח שלי
            </Text>
            <View className="p-4 md:p-8">
              {currentMood ? (
                <View className={`${isTablet ? "w-2/3" : "w-full"} mx-auto`}>
                  <MoodMeter currentMood={currentMood} />
                </View>
              ) : (
                <Text className="text-center text-base md:text-lg">
                  בחר מצב רוח
                </Text>
              )}
            </View>
          </ViewShot>
          <View className="w-[280px] flex flex-row justify-center items-center gap-6">
            <TouchableOpacity
              className="w-12 h-12 flex justify-center items-center py-3 md:py-4 bg-blue-700 rounded-full shadow-md"
              onPress={() => handleShare("moodMeter")}
            >
              <IconComponent color="white" name="share" />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-4/5 flex justify-center items-center py-3 md:py-4 bg-blue-700 rounded-md shadow-md"
              onPress={() => setShowEmojiPicker(true)}
            >
              <Text className="font-bold text-center text-white text-lg md:text-xl">
                בחר מצב רוח
              </Text>
            </TouchableOpacity>
          </View>
          {/* <MoodHistory entries={localMoodHistory} />
                  {moodHistoryError && <Text className="text-red-500 text-right mb-2 text-base md:text-lg">שגיאה בטעינת היסטוריית מצב הרוח</Text>}
                  {isMoodHistoryLoading && <Text className="text-center text-base md:text-lg">טוען היסטוריית מצב רוח...</Text>} */}
          {/* {moodStatisticsError && <Text className="text-red-500 text-right mb-2 text-base md:text-lg">שגיאה בטעינת הסטטיסטיקות</Text>}
                  {isMoodStatisticsLoading ? (
                      <Text className="text-center text-base md:text-lg">טוען סטטיסטיקות...</Text>
                  ) : (
                      localMoodStatistics && <Statistics stats={localMoodStatistics} />
                  )} */}
          <View className="h-[2px] mt-12 rounded-full bg-slate-100 w-full" />  
          <View className="w-full p-4 md:p-8 flex flex-row justify-between items-center">
            <TouchableOpacity
              className="w-12 h-12 flex justify-center items-center self-start bg-blue-700 rounded-full shadow-md"
              onPress={() => handleShare("moodChart")}
            >
              <IconComponent color="white" name="share" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPeriodPicker(true)}
              className="bg-gray-200 py-2 px-4 rounded-md self-end mb-2"
            >
              <Text className="text-base md:text-lg">
                {periodLabels[selectedPeriod]} ▼
              </Text>
            </TouchableOpacity>
          </View>
          <ViewShot
            ref={chartViewShotRef}
            options={{ format: "jpg", quality: 1 }}
            style={{
              backgroundColor: "white",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}

          >
            <Text className="text-4xl font-bold">מצב הרוח שלי</Text>
            <MoodLineChart
              initialMockEmojis={initialMockEmojis}
              moodHistory={localMoodHistory}
              selectedFilter={selectedPeriod}
              loading={isMoodHistoryLoading}
              error={!!moodHistoryError}
              isRefetching={false}
              onRefetch={refetchMoodHistory}
            />
          </ViewShot>
        </ScrollView>
        {initialMockEmojis && (
          <EmojiPicker
            visible={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={handleMoodChange}
            emojis={initialMockEmojis}
          />
        )}
        <AnimatedWindow
          visible={showIntroWindow}
          onClose={() => setShowIntroWindow(false)}
          animationConfig={{ scale: true, fade: true }}
          showCloseArrow={false}
        >
          <View className="w-full h-full flex-1 justify-between bg-white p-4 md:p-8 rounded-t-3xl">
            <View className="flex-1 justify-start items-center mt-10">
              <Icon
                name="information-outline"
                size={isTablet ? 70 : 50}
                color="#000"
                className="mb-4"
              />
              <Text className="text-2xl md:text-3xl font-bold mb-6 text-center">
                ברוך הבא!
              </Text>
              <Text className="text-base md:text-lg text-center mb-4">
                במסך זה תוכל לעדכן את מצב הרוח שלך
              </Text>
              <Text className="text-base md:text-lg text-center mb-4">
                בחר את האימוג'י שמתאר את מצב הרוח שלך כרגע
              </Text>
              <View className="flex-row justify-around mb-4">
                {initialMockEmojis &&
                  initialMockEmojis.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleMoodChange(emoji)}
                    >
                      <Image src={emoji.image} className="w-16 h-16" />
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </View>
        </AnimatedWindow>
        <Modal visible={showPeriodPicker} transparent animationType="slide">
          <View className="flex-1 justify-end bg-transparent">
            <View className="bg-gray-50 shadow-md p-4 rounded-t-3xl">
              <Text className="text-center text-lg font-bold mb-4">
                בחר תקופה
              </Text>
              <FlatList
                data={periods}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPeriod(item);
                      setShowPeriodPicker(false);
                    }}
                    className="py-3 border-b border-gray-200"
                  >
                    <Text className="text-center">{periodLabels[item]}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item}
              />
              <TouchableOpacity
                onPress={() => setShowPeriodPicker(false)}
                className="bg-gray-200 py-2 px-4 rounded-md mt-4"
              >
                <Text className="text-center">סגור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

function EmojiPicker({
  visible,
  onClose,
  onSelect,
  emojis,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: MoodEmoji) => void;
  emojis: MoodEmoji[];
}) {
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View className="flex-1 justify-end bg-transparent">
        <View className="bg-gray-50 shadow-md p-4 md:p-8 rounded-t-3xl">
          <Text className="text-center text-lg md:text-xl font-bold mb-4">
            בחר מצב רוח
          </Text>
          <View className="flex-row flex-wrap flex-grow justify-around mb-4">
            {emojis.map((emoji, index) => (
              <TouchableOpacity key={index} onPress={() => onSelect(emoji)}>
                <Image src={emoji.image} className="w-16 h-16" />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-200 py-2 px-4 rounded-md"
          >
            <Text className="text-center text-base md:text-lg">סגור</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// function MoodHistory({ entries }: { entries: MoodEntry[] }) {
//   const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("day");
//   const [showPeriodPicker, setShowPeriodPicker] = useState(false);
//   const [filteredEntries, setFilteredEntries] = useState<MoodEntry[]>([]);

//   const handleTogglePeriodPicker = () => {
//     setShowPeriodPicker((prev) => !prev);
//   };

//   const periods: TimePeriod[] = [
//     "day",
//     "week",
//     "month",
//     "year",
//     "1_month_ago",
//     "2_months_ago",
//     "3_months_ago",
//     "ever",
//   ];

//   const periodLabels: Record<TimePeriod, string> = {
//     day: "היום",
//     week: "השבוע",
//     month: "החודש",
//     year: "השנה",
//     "1_month_ago": "לפני חודש",
//     "2_months_ago": "לפני חודשיים",
//     "3_months_ago": "לפני 3 חודשים",
//     ever: "מאז ומתמיד",
//   };

//   const getTimeRangeText = (daysAgo: number, chosenAt: Date): string => {
//     const today = new Date();
//     if (chosenAt.toDateString() === today.toDateString()) return "היום";
//     if (daysAgo === 0) return "אתמול";
//     if (daysAgo === 1) return "אתמול";
//     if (daysAgo < 7) return `לפני ${daysAgo} ימים`;
//     if (daysAgo < 14) return "לפני שבוע";
//     if (daysAgo < 30) return `לפני ${Math.floor(daysAgo / 7)} שבועות`;
//     if (daysAgo < 60) return "לפני חודש";
//     if (daysAgo < 365) return `לפני ${Math.floor(daysAgo / 30)} חודשים`;
//     if (daysAgo < 730) return "לפני שנה";
//     return `לפני ${Math.floor(daysAgo / 365)} שנים`;
//   };

//   useEffect(() => {
//     const filtered = filterEntriesByPeriod(entries, selectedPeriod);
//     const sorted = filtered.sort(
//       (a, b) => b.chosenAt.getTime() - a.chosenAt.getTime()
//     );
//     setFilteredEntries(sorted);
//   }, [selectedPeriod, entries]);

//   return (
//     <View className="my-8 md:my-12">
//       <Text className="text-right text-lg md:text-xl mt-4 mb-2">היסטוריה</Text>
//       <TouchableOpacity
//         onPress={handleTogglePeriodPicker}
//         className="bg-gray-200 py-2 px-4 rounded-md self-end mt-4"
//       >
//         <Text className="text-base md:text-lg">
//           {periodLabels[selectedPeriod]} ▼
//         </Text>
//       </TouchableOpacity>
//       {filteredEntries.map((entry, index) => (
//         <View
//           key={index}
//           className="flex-row justify-between items-center border-b border-gray-200 py-2 md:py-3"
//         >
//           <Icon name={entry.emoji.image} color={entry.emoji.color} size={24} />
//           <View className="flex-row">
//             <Text className="text-base md:text-lg">
//               {getTimeRangeText(
//                 getDurationInDays(entry.chosenAt),
//                 entry.chosenAt
//               )}
//             </Text>
//             <Text className="ml-2 text-base md:text-lg">
//               {entry.chosenAt.toLocaleDateString()}
//             </Text>
//           </View>
//         </View>
//       ))}
//       <Modal visible={showPeriodPicker} transparent animationType="slide">
//         <View className="flex-1 justify-end bg-transparent">
//           <View className="bg-gray-50 shadow-md p-4 rounded-t-3xl">
//             <Text className="text-center text-lg font-bold mb-4">
//               בחר תקופה
//             </Text>
//             <FlatList
//               data={periods}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   onPress={() => {
//                     setSelectedPeriod(item);
//                     setShowPeriodPicker(false);
//                   }}
//                   className="py-3 border-b border-gray-200"
//                 >
//                   <Text className="text-center">{periodLabels[item]}</Text>
//                 </TouchableOpacity>
//               )}
//               keyExtractor={(item) => item}
//             />
//             <TouchableOpacity
//               onPress={() => setShowPeriodPicker(false)}
//               className="bg-gray-200 py-2 px-4 rounded-md mt-4"
//             >
//               <Text className="text-center">סגור</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// function Statistics({ stats }: { stats: MoodStatistic[] }) {
//   const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("day");
//   const [showPeriodPicker, setShowPeriodPicker] = useState(false);
//   const [filteredStats, setFilteredStats] = useState<MoodStatistic[]>([]);

//   const periods: TimePeriod[] = [
//     "day",
//     "week",
//     "month",
//     "year",
//     "1_month_ago",
//     "2_months_ago",
//     "3_months_ago",
//     "ever",
//   ];

//   const periodLabels: Record<TimePeriod, string> = {
//     day: "היום",
//     week: "השבוע",
//     month: "החודש",
//     year: "השנה",
//     "1_month_ago": "לפני חודש",
//     "2_months_ago": "לפני חודשיים",
//     "3_months_ago": "לפני 3 חודשים",
//     ever: "מאז ומתמיד",
//   };

//   useEffect(() => {
//     const filteredStats = filterStatsByPeriod(stats, selectedPeriod);
//     setFilteredStats(filteredStats);
//   }, [selectedPeriod, stats]); // Add stats to dependency array

//   return (
//     <View className="my-8 md:my-12">
//       <Text className="text-right text-lg md:text-xl mt-4 mb-2">
//         סטטיסטיקות
//       </Text>
//       <TouchableOpacity
//         className="bg-gray-200 py-2 px-4 rounded-md self-end mb-2"
//         onPress={() => setShowPeriodPicker(true)}
//       >
//         <Text className="text-base md:text-lg">
//           {periodLabels[selectedPeriod]} ▼
//         </Text>
//       </TouchableOpacity>
//       {filteredStats.map((stat, index) => (
//         <View
//           key={index}
//           className="flex-row justify-between items-center border-b border-gray-200 py-2 md:py-3"
//         >
//           <Icon name={stat.emoji.image} color={stat.emoji.color} size={24} />
//           <Text className="text-base md:text-lg">
//             נבחר {stat.timesChosen} פעמים
//           </Text>
//         </View>
//       ))}
//       <Modal visible={showPeriodPicker} transparent animationType="slide">
//         <View className="flex-1 justify-end bg-transparent">
//           <View className="bg-gray-50 shadow-md p-4 rounded-t-3xl">
//             <Text className="text-center text-lg font-bold mb-4">
//               בחר תקופה
//             </Text>
//             <FlatList
//               data={periods}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   onPress={() => {
//                     setSelectedPeriod(item);
//                     setShowPeriodPicker(false);
//                   }}
//                   className="py-3 border-b border-gray-200"
//                 >
//                   <Text className="text-center">{periodLabels[item]}</Text>
//                 </TouchableOpacity>
//               )}
//               keyExtractor={(item) => item}
//             />
//             <TouchableOpacity
//               onPress={() => setShowPeriodPicker(false)}
//               className="bg-gray-200 py-2 px-4 rounded-md mt-4"
//             >
//               <Text className="text-center">סגור</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// function filterStatsByPeriod(
//   stats: MoodStatistic[],
//   period: TimePeriod
// ): MoodStatistic[] {
//   const now = new Date();
//   const startDate = getPeriodStartDate(period, now);

//   return stats.filter((stat) => {
//     const statDate = new Date(stat.date);
//     return statDate >= startDate && statDate <= now;
//   });
// }

// function getStartDate(period: TimePeriod, now: Date): Date {
//   const startDate = new Date(now);

//   switch (period) {
//     case "day":
//       startDate.setHours(0, 0, 0, 0);
//       break;
//     case "week":
//       startDate.setDate(now.getDate() - now.getDay());
//       startDate.setHours(0, 0, 0, 0);
//       break;
//     case "month":
//       startDate.setDate(1);
//       startDate.setHours(0, 0, 0, 0);
//       break;
//     case "year":
//       startDate.setMonth(0, 1);
//       startDate.setHours(0, 0, 0, 0);
//       break;
//     case "1_month_ago":
//       startDate.setMonth(now.getMonth() - 1);
//       break;
//     case "2_months_ago":
//       startDate.setMonth(now.getMonth() - 2);
//       break;
//     case "3_months_ago":
//       startDate.setMonth(now.getMonth() - 3);
//       break;
//     case "ever":
//       return new Date(0); // Beginning of time
//   }

//   return startDate;
// }

// function getDurationInDays(chosenAt: Date): number {
//   const now = new Date();
//   const diffTime = Math.abs(now.getTime() - chosenAt.getTime());
//   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
// }


