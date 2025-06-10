import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import Header from "./core/header";
import { useCurrentUser } from "@/context/user-context";
import { useEffect, useState, useCallback } from "react";
import Tabs from "./core/tabs";
import { CategoryDocument } from "@/types";
import CategoryWorkCard from "./category-work-card";
import Icon from "react-native-vector-icons/Ionicons";
import SubCircleReadonly from "./svg/sub-circle-readonly";
import Toast from "react-native-toast-message";

interface LifeImprovementModalProps {
  handleUpdateCategory: (updatedCategory: CategoryDocument) => Promise<void>;
}

export default function LifeImprovementModal({
  handleUpdateCategory,
}: LifeImprovementModalProps) {
  const { currentUser, loading } = useCurrentUser();
  const [inWorkCategories, setInWorkCategories] = useState<CategoryDocument[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchCategories, setSearchCategories] = useState<CategoryDocument[]>(
    []
  );
  const [searchValue, setSearchValue] = useState<string>("");
  const tabs = ["בשיפור", "היסטוריה"];

  const circleSize = (Dimensions.get("screen").width - 40) / 1.9;

  const inputStyle = {
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    backgroundColor: loading ? "lightgray" : "white",
    textAlign: "right",
    width: "100%",
    marginHorizontal: "auto",
  };

  const handleDeActivateCategory = async (categoryIndex: number) => {
    try {
      await handleUpdateCategory({
        ...inWorkCategories[categoryIndex],
        active: false,
      });
      Toast.show({
        text1: "הצלחה!",
        text2: "סיימת לשפר את הקטגוריה שלך בהצלחה!",
        type: "success",
      });
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.categories) {
      setInWorkCategories(
        currentUser.categories.filter((category) => category.active)
      );
      setSearchCategories(currentUser.categories);
    }
  }, [loading, currentUser.categories]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);

      if (value.trim()) {
        const lowerCaseValue = value.toLowerCase();

        setSearchCategories(
          currentUser.categories.filter((category) => {
            // Check if the category name matches the search value
            const categoryNameMatches = category.name
              .toLowerCase()
              .includes(lowerCaseValue);

            // Check if any goal under this category matches the search value
            const goalsInCategory = currentUser.goals.filter(
              (goal) => goal.categoryId === category.id
            );
            const goalNameMatches = goalsInCategory.some((goal) =>
              goal.name.toLowerCase().includes(lowerCaseValue)
            );

            // Include the category if either its name or one of its goals' names matches the search value
            return categoryNameMatches || goalNameMatches;
          })
        );
      } else {
        // Reset to all categories if search is empty
        setSearchCategories(currentUser.categories);
      }
    },
    [currentUser.categories, currentUser.goals]
  );

  const InWorkComponent = useCallback(() => {
    return (
      <View className="flex-1 justify-start items-center p-4">
        {inWorkCategories.map((category, index) => {
          return (
            <CategoryWorkCard
              category={category}
              index={index}
              handleDeActivateCategory={handleDeActivateCategory}
              key={index}
            />
          );
        })}
      </View>
    );
  }, [inWorkCategories]);

  const SearchBar = useCallback(({ value, onChange }) => {
    return (
      <View className="flex-row items-center" style={inputStyle as any}>
        <Icon name="search-outline" size={24} color="gray" />
        <TextInput
          className="flex-1 ml-2"
          placeholder="חיפוש חופשי.."
          textAlign="right"
          onChangeText={onChange}
          value={value}
        />
      </View>
    );
  }, []);

  const HistoryComponent = () => {
    return (
      <View className="w-full flex-1 justify-start items-center p-4">
        <ScrollView
          contentContainerClassName="py-6 w-full gap-6 justify-center items-center"
          keyboardShouldPersistTaps="handled" // Important to ensure keyboard remains open while scrolling
        >
          {searchCategories.map((category, index) => {
            const categoryGoals = currentUser.goals.filter(
              (goal) => goal.categoryId === category.id
            );
            return (
              <View
                className="w-full p-4 mb-4 rounded-lg shadow bg-gray-100 border-l-4 border-blue-500 justify-center items-center"
                key={index}
              >
                <Text className="text-lg font-bold">{category.name}</Text>
                {categoryGoals.length > 0 ? (
                  <SubCircleReadonly
                    key={index}
                    goals={categoryGoals}
                    size={circleSize}
                  />
                ) : (
                  <View className="w-full justify-center items-center">
                    <Text className="w-full text-lg text-gray-400 font-bold">
                      אין כרגע מטרות לקטגוריה זו
                    </Text>
                  </View>
                )}
                {category.active && (
                  <Text className="text-gray-400 font-bold">
                    סטטוס: {category.active ? "בעבודה" : "סויים"}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const handleTabChange = (tab: number) => {
    setActiveTab(tab);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, width: "100%" }}
      className="mt-8"
    >
      <Header
        showBorder={false}
        showLogo={false}
        label="קטגוריות בעבודה"
        showMenu={false}
      />
      <View className="w-full flex-1 justify-center items-center pt-6 mt-10">
        <Tabs
          tabsList={tabs}
          activeTabIndex={activeTab}
          onTabIndexChange={handleTabChange}
        />
        {activeTab === 0 && <InWorkComponent />}
        {activeTab === 1 && (
          <View className="w-full h-full flex-1 p-4">
            <SearchBar value={searchValue} onChange={handleSearch} />
            <HistoryComponent />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
