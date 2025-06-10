import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";
import Swiper from "react-native-swiper";
import Icon from "react-native-vector-icons/FontAwesome6";
import { useCurrentUser } from "@/context/user-context";
import { useArchivedGrades } from "hooks/useArchivedGrades";
import LineChartComponent from "@/components/svg/charts/grades-line-chart";
import GradesBarChart from "@/components/svg/charts/grades-bar-chart";
import PressableIcon from "@/components/core/preeable-icon";
import GradeBarChart from "@/components/svg/charts/grades-bar-chart-per-category";
import { shareAsync } from "expo-sharing";
import SubTabs from "@/components/svg/sub-tabs";
import GoalsGradeBarChart from "@/components/svg/charts/goals-bar-chart-per-category";
import messaging from "@react-native-firebase/messaging";
import { useFocusEffect } from "@react-navigation/native";
import { useWindowDimensions } from "react-native";
import MonthYearPicker, { EventTypes } from "react-native-month-year-picker";
import { firebase } from "@react-native-firebase/firestore";
import { getDateDJ, getNowDJ } from "@/utils/dates";
import { Dayjs } from "dayjs";

const ProgressScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<number>(0);
  const [categoryIndex, setCategoryIndex] = useState<number>(0);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(getNowDJ());
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [isHistoryFilterActive, setIsHistoryFilterActive] =
    useState<boolean>(false);

  const { currentUser } = useCurrentUser();

  const { archivedGrades, loadingGrades, refetch, isError } = useArchivedGrades(
    {
      filters: [
        {
          field: "userId",
          operator: "==",
          value: currentUser && currentUser.id,
        },
      ],
    }
  );

  const currentCategory = useMemo(
    () => currentUser?.filteredCategories[categoryIndex],
    [currentUser, categoryIndex]
  );

  const { width, height } = useWindowDimensions();

  const chartConfig = {
    backgroundGradientFrom: "#f1f1f1",
    backgroundGradientTo: "#f1f1f1",
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 1,
    decimalPlaces: 0,
    yAxisInterval: 2,
    yAxisSuffix: "",
    yAxisLabelColor: () => "#000",
    yLabels: [0, 2, 4, 6, 8, 10],
  };

  const barChartConfig = {
    backgroundGradientFrom: "#f1f1f1",
    backgroundGradientTo: "#f1f1f1",
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    decimalPlaces: 0,
    fillShadowGradient: "#007AFF",
    fillShadowGradientOpacity: 1,
    propsForVerticalLabels: {
      rotation: -70,
    },
  };

  const viewShotRef = useRef(null);

  const handleShare = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const uri = await captureRef(viewShotRef, {
        format: "jpg",
        quality: 1,
        result: "tmpfile",
      });

      await shareAsync(uri, { mimeType: "image/jpeg" });
    } catch (error) {
      console.error("Error sharing the image", error);
    }
  };

  const barChartViewShotRefs = useRef<Array<React.RefObject<any>>>([]);

  useEffect(() => {
    if (currentUser?.filteredCategories) {
      barChartViewShotRefs.current = currentUser.filteredCategories.map(() =>
        React.createRef()
      );
    }
  }, [currentUser?.filteredCategories]);

  const toggleActiveSubTab = (index: number) => {
    setActiveSubTab(index);
  };

  const handleSmallBarChartShare = async (index: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const ref = barChartViewShotRefs.current[index];
      if (!ref?.current) {
        console.error("No ref found for index", index);
        return;
      }

      const uri = await captureRef(ref.current, {
        format: "jpg",
        quality: 1,
      });

      await shareAsync(uri, { mimeType: "image/jpeg" });
    } catch (error) {
      console.error("Error sharing the image", error);
    }
  };

  const handleRefetch = async () => {
    setIsRefetching(true);
    try {
      await refetch();
    } finally {
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      if (remoteMessage.data?.type === "weekly_summary") {
        setSelectedDate(getNowDJ());
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage?.data?.type === "weekly_summary") {
          setSelectedDate(getNowDJ);
        }
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setIsRefetching(true);
        try {
          await Promise.all([refetch()]);
        } finally {
          setIsRefetching(false);
        }
      };

      fetchData();
    }, [refetch])
  );

  const renderChart = () => {
    const commonProps = {
      width: width * 0.9,
      height: height * 0.4,
      selectedDate,
    };

    if (activeTab === 0) {
      return (
        <View className="w-full justify-center items-center">
          <Text className="text-center text-lg font-semibold mb-4">
            גרף {currentCategory?.name}
          </Text>
          <LineChartComponent
            {...commonProps}
            archivedGrades={archivedGrades}
            chartConfig={chartConfig}
            currentCategory={currentCategory}
            error={isError}
            isRefetching={isRefetching}
            loading={loadingGrades}
            onRefetch={handleRefetch}
            isHistoryFilterActive={isHistoryFilterActive}
          />
        </View>
      );
    }
    if (activeTab === 1) {
      return (
        <GradesBarChart
          {...commonProps}
          archievedGrades={archivedGrades}
          error={isError}
          chartConfig={{
            ...barChartConfig,
            propsForVerticalLabels: {
              fontWeight: "bold",
              rotation: -70,
              translateY: -30,
              fill: "#000000",
            },
          }}
          isRefetching={isRefetching}
          loading={loadingGrades}
          onRefetch={handleRefetch}
        />
      );
    }
    return null;
  };

  const getChartDimensions = () => {
    const isLandscape = width > height;
    const aspectRatio = 1.6; // Match the chart component's aspect ratio

    if (isLandscape) {
      const chartHeight = height * 0.6; // Use 60% of screen height
      return {
        width: chartHeight * aspectRatio,
        height: chartHeight,
      };
    }

    // Portrait mode - use original calculations
    return {
      width: width * 0.8,
      height: height * 0.3,
    };
  };

  const handleDateChange = (event: EventTypes, date?: Date) => {
    setShowPicker(false);
    if (event === "neutralAction") {
      setIsHistoryFilterActive(true);
    } else if (event !== "dismissedAction") {
      setIsHistoryFilterActive(false);
      if (date) {
        setSelectedDate(getDateDJ(date));
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="w-full justify-center items-center pt-10 pb-5">
        {/* Navigation Bar */}
        <ScrollView
          contentContainerStyle={{
            justifyContent: "center",
            alignItems: "center",
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5 px-5"
        >
          <View className="w-full flex flex-row justify-center items-center">
            {["דירוג", "מצב נוכחי"].map((tab, index) => (
              <Pressable
                key={index}
                onPress={() => setActiveTab(index)}
                className={`py-2 px-6 rounded-lg mr-2 ${activeTab === index ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <Text
                  className={`${activeTab === index ? "text-white" : "text-gray-700"} text-base font-semibold`}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Swiper for Categories */}
        {activeTab === 0 && (
          <Swiper
            showsPagination={true}
            loop={false}
            index={categoryIndex}
            onIndexChanged={setCategoryIndex}
            showsButtons
            prevButton={<Icon name="arrow-left" size={20} color="#007AFF" />}
            nextButton={<Icon name="arrow-right" size={20} color="#007AFF" />}
            style={{ height: height * 0.2 }}
            dot={<View />}
            activeDot={<View />}
          >
            {currentUser?.filteredCategories.map((category, index) => (
              <View key={index} className="flex-1 items-center justify-center">
                <Icon name={category.icon} size={24} />
                <Text className="text-lg font-bold mb-2">{category.name}</Text>
                <Text className="text-sm text-gray-600">
                  החלק כדי לעבור קטגוריה
                </Text>
              </View>
            ))}
          </Swiper>
        )}

        {/* Chart Display with Date Picker */}
        <View className="items-center">
          <View className="flex-row justify-between items-center w-full px-7 mb-3">
            <View className="flex flex-row justify-center items-center gap-x-6">
              <PressableIcon
                name="arrows-rotate"
                onPress={handleRefetch}
                size={18}
              />
              <PressableIcon
                name="share-from-square"
                onPress={handleShare}
                size={18}
              />
            </View>
            <Pressable
              onPress={() => setShowPicker(true)}
              className="p-3 rounded-lg bg-blue-700"
            >
              <Text className="text-white text-sm font-semibold">
                {!isHistoryFilterActive &&
                  selectedDate.toDate().toLocaleDateString("he-IL", {
                    month: "long",
                    year: "numeric",
                  })}
                {isHistoryFilterActive && "היסטוריה"}
              </Text>
            </Pressable>
          </View>

          {/* Render Chart */}
          <ViewShot ref={viewShotRef}>
            <View style={{ backgroundColor: "white", padding: 20 }}>
              {renderChart()}
            </View>
          </ViewShot>
        </View>

        {activeTab === 1 && (
          <View className="w-full flex justify-center items-center gap-6 py-4">
            <SubTabs
              activeSubTab={activeSubTab}
              toggleActiveSubTab={toggleActiveSubTab}
            />
          </View>
        )}

        {activeTab === 1 && (
          <Swiper
            showsPagination={true}
            loop={false}
            index={categoryIndex}
            onIndexChanged={setCategoryIndex}
            showsButtons
            prevButton={<Icon name="arrow-left" size={20} color="#007AFF" />}
            nextButton={<Icon name="arrow-right" size={20} color="#007AFF" />}
            style={{
              height: getChartDimensions().height + 100,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {currentUser.filteredCategories.map((category, index) => {
              const filteredArchievedGradesCategoriesOnly =
                archivedGrades.filter(
                  (archivedGrade) =>
                    archivedGrade.name === category.name &&
                    archivedGrade.type === "category"
                );
              const filteredArchievedGradesGoalsOnly = archivedGrades.filter(
                (archivedGrade) =>
                  archivedGrade.icon === category.icon &&
                  archivedGrade.type === "goal"
              );

              const { width: chartWidth, height: chartHeight } =
                getChartDimensions();

              return (
                <ViewShot
                  ref={barChartViewShotRefs.current[index]}
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: width,
                    height: chartHeight * 1.2,
                  }}
                  key={index}
                >
                  <View
                    className="w-full min-h-full justify-center items-center"
                    style={{ backgroundColor: "white", padding: 20 }}
                  >
                    <View className="flex flex-row justify-center items-center gap-x-5">
                      <PressableIcon
                        name="share-from-square"
                        onPress={() => handleSmallBarChartShare(index)}
                        size={18}
                      />
                      <Text className="font-bold text-center text-lg py-2">
                        {category.name}
                      </Text>
                    </View>
                    {activeSubTab === 0 && (
                      <GradeBarChart
                        width={chartWidth}
                        height={chartHeight}
                        loading={loadingGrades}
                        error={isError}
                        archievedGrades={filteredArchievedGradesCategoriesOnly}
                        chartConfig={barChartConfig}
                        category={category}
                      />
                    )}
                    {activeSubTab === 1 && (
                      <GoalsGradeBarChart
                        width={chartWidth}
                        height={chartHeight}
                        loading={loadingGrades}
                        error={isError}
                        archievedGrades={filteredArchievedGradesGoalsOnly}
                        chartConfig={barChartConfig}
                      />
                    )}
                  </View>
                </ViewShot>
              );
            })}
          </Swiper>
        )}
      </View>

      {showPicker && (
        <MonthYearPicker
          onChange={handleDateChange}
          value={selectedDate.toDate()}
          minimumDate={new Date(2000, 0)}
          maximumDate={new Date()}
          okButton="בחר"
          cancelButton="בטל"
          locale="he"
          neutralButton="היסטוריה"
        />
      )}
    </ScrollView>
  );
};

export default ProgressScreen;
