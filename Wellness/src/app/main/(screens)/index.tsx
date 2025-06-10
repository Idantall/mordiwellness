import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";
import { shareAsync } from "expo-sharing";
import LifeWheel from "@/components/svg/life-wheel";
import { useCurrentUser } from "@/context/user-context";
import Spinner from "react-native-loading-spinner-overlay";
import Toast from "react-native-toast-message";
import { ArchievedGrade, CategoryDocument } from "types";
import SubCircleReadonly from "@/components/svg/sub-circle-readonly";
import CategoryScreen from "components/category-screen";
import CustomModal from "components/core/custom-window";
import LottieAnimation from "@/components/lotties/bird-lottie";
import { createArchivedGrade } from "@/firebase-config/firebase-history";
import GuidingQuestionsWindow from "@/components/first-time-goals/guiding-questions";
import PressableIcon from "@/components/core/preeable-icon";
import CustomPressable from "@/components/custom-pressable";
import LifeImprovementModal from "@/components/live-improvement-modal";
import GridLayout from "components/core/grid";
import { getNowDJ } from "@/utils/dates";
import { useQueryClient } from "react-query";

const Page: React.FC = () => {
  const {
    currentUser,
    loading: userLoading,
    updateCategoriesOnFireStore,
    updateCategoriesOnState,
  } = useCurrentUser();
  const queryClient = useQueryClient();
  const [sharing, setSharing] = useState<boolean>(false);
  const [savingGrade, setSavingGrade] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showGuidingQuestionsModal, setShowGuidingQuestionsModal] =
    useState<boolean>(false);
  const [showLiveImprovementModal, setShowLifeImporvementModal] =
    useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryDocument | null>(null);
  const viewShotRef = useRef();
  const [categoriesToImprove, setCategoriesToImprove] = useState<
    CategoryDocument[]
  >([]);
  const [averageGrade, setAverageGrade] = useState<number>(0);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const { width, height } = useWindowDimensions();
  const isTablet = width > 768;
  const circleSize = isTablet ? (width - 80) / 6 : (width - 40) / 3;

  const handleCategorySelect = (category: CategoryDocument) => {
    setSelectedCategory(category);
    if (category.active) {
      setShowCategoryModal(true);
    } else {
      setShowGuidingQuestionsModal(true);
    }
  };

  const handleCloseAndOpen = () => {
    setShowGuidingQuestionsModal(false);
    setShowCategoryModal(true);
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setShowCategoryModal(false);
    setShowGuidingQuestionsModal(false);
    setShowLifeImporvementModal(false);
  };

  const handleCloseGuidingQuestionsModal = () => {
    setShowGuidingQuestionsModal(false);
  };

  const handleUpdateCategory = async (updatedCategory: CategoryDocument) => {
    try {
      const updatedCategories = currentUser.categories.map((category) =>
        category.index === updatedCategory.index ? updatedCategory : category
      );
      updateCategoriesOnState(updatedCategories);
      await updateCategoriesOnFireStore(updatedCategories);
      const archiveProps: Partial<ArchievedGrade> = {
        name: updatedCategory.name,
        icon: updatedCategory.icon,
        color: updatedCategory.color,
        grade: updatedCategory.grade,
        gradedAt: getNowDJ().toDate(),
        userId: currentUser.id,
        type: "category",
      };
      await createArchivedGrade({ ...archiveProps });
      queryClient.invalidateQueries(["archived-grades"])
      
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "אוי לא!",
        text2: "שגיאה בעת דירוג הקטגוריה!",
      });
      console.error("Error updating category:", err);
    }
  };

  const handleUpdateFromCircle = async (updatedCategory: CategoryDocument) => {
    setSavingGrade(true);
    try {
      await handleUpdateCategory(updatedCategory);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "אוי לא!",
        text2: "שגיאה בעת דירוג הקטגוריה!",
      });
      console.error("Error updating category:", err);
    } finally {
      setSavingGrade(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const uri = await captureRef(viewShotRef, {
        format: "jpg",
        quality: 1,

      });

      await shareAsync(uri, { mimeType: "image/jpeg" });
    } catch (error) {
      console.error("Error sharing the image", error);
      Toast.show({
        type: "error",
        text1: "שגיאה",
        text2: "אירעה שגיאה בעת שיתוף התמונה",
      });
    } finally {
      setSharing(false);
    }
  };

  const calculateAverageGrade = (categories: CategoryDocument[]): number => {
    const sum = categories.reduce((acc, category) => acc + category.grade, 0);
    return Math.round((sum / categories.length) * 10) / 10;
  };

  useEffect(() => {
    if (currentUser && currentUser.filteredCategories) {
      const improvedCategories = currentUser.filteredCategories.some(
        (category) => category.grade <= 3
      )
        ? currentUser.filteredCategories.filter(
            (category) => category.grade <= 3
          )
        : currentUser.filteredCategories.filter(
            (category) => category.grade <= 4
          );
      setCategoriesToImprove(improvedCategories);
      setAverageGrade(calculateAverageGrade(currentUser.filteredCategories));
    }
    setIsDataLoaded(true);
  }, [currentUser]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Spinner
        visible={userLoading || savingGrade || sharing}
        textContent={
          userLoading ? "טוען מעגל.." : savingGrade ? "שומר דירוג.." : "משתף.."
        }
        textStyle={{ color: "#FFF" }}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        {!userLoading && currentUser && (
          <View className="flex-1 items-center px-4 sm:px-6 md:px-8 pb-20">
            <View className="w-full flex flex-row justify-between items-center">
              <CustomPressable
                title="שיפור מצב"
                onPress={() => setShowLifeImporvementModal(true)}
              />
              <PressableIcon
                name="share-from-square"
                onPress={handleShare}
                size={isTablet ? 32 : 24}
                color="blue"
              />
            </View>
            {isDataLoaded ? (
              <>
                <Text className="text-center text-2xl sm:text-3xl md:text-4xl p-2 font-bold">
                  ממוצע: {averageGrade}
                </Text>
                <ViewShot
                  ref={viewShotRef}
                  options={{
                    format: "jpg",
                    quality: 1,
                    fileName: "life-wheel",
                  }}
                >
                  <View className="bg-white p-4 sm:p-6 md:p-8">
                    <Text className="text-center text-4xl md:text-5xl lg:text-6xl">גלגל החיים שלי</Text>
                    <LifeWheel
                      categories={currentUser.filteredCategories}
                      onUpdateCategory={handleUpdateFromCircle}
                      size={Math.min(width * 0.8, height * 0.6)}
                    />
                  </View>
                </ViewShot>
                <Text className="text-center text-base sm:text-lg md:text-xl pt-4 pb-2">
                  קטגוריות לשיפור:
                </Text>
                {categoriesToImprove.length < 1 ? (
                  <View className="flex-1 justify-center items-center">
                    <LottieAnimation />
                    <Text className="text-center text-xl sm:text-2xl md:text-3xl font-bold text-gray-400">
                      אין קטגוריות לשיפור
                    </Text>
                  </View>
                ) : (
                  <GridLayout
                    data={categoriesToImprove}
                    numColumns={isTablet ? 6 : 3}
                    containerStyle={{
                      paddingVertical: 44,
                      rowGap: 48,
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginLeft: 6,
                    }}
                    itemSpacing={10}
                    renderItem={({ item: category }) => (
                      <TouchableOpacity
                        onPress={() => handleCategorySelect(category)}
                        className="w-full items-center"
                      >
                        <Text
                          className="text-center font-bold text-sm sm:text-base md:text-lg"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {category.name}
                        </Text>
                        <SubCircleReadonly
                          goals={currentUser.goals.filter(
                            (goal) => goal.categoryId === category.id
                          )}
                          size={circleSize}
                          hideGoalNames={true}
                        />
                      </TouchableOpacity>
                    )}
                  />
                )}
              </>
            ) : (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#0000ff" />
                <Text className="mt-2 text-center text-base sm:text-lg md:text-xl">
                  טוען נתונים...
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <CustomModal
        animationConfig={{
          slide: true,
          slideDirection: "right",
        }}
        visible={showCategoryModal}
        onClose={handleClose}
        showCloseArrow={true}
      >
        <CategoryScreen selectedCategory={selectedCategory} />
      </CustomModal>
      <CustomModal
        animationConfig={{
          slide: true,
          slideDirection: "right",
        }}
        visible={showGuidingQuestionsModal}
        onClose={handleClose}
        showCloseArrow={false}
      >
        <GuidingQuestionsWindow
          handleClose={handleCloseGuidingQuestionsModal}
          handleUpdateCategory={handleUpdateFromCircle}
          handleCloseAndOpen={handleCloseAndOpen}
          selectedCategory={selectedCategory}
        />
      </CustomModal>
      <CustomModal
        animationConfig={{
          slide: true,
          slideDirection: "right",
        }}
        visible={showLiveImprovementModal}
        onClose={handleClose}
      >
        <LifeImprovementModal handleUpdateCategory={handleUpdateCategory} />
      </CustomModal>
    </SafeAreaView>
  );
};

export default Page;
