import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useCurrentUser } from "@/context/user-context";
import { ArchievedGrade, CategoryDocument, GoalDocument } from "types";
import Toast from "react-native-toast-message";
import SubCircle from "@/components/svg/sub-circle";
import Spinner from "react-native-loading-spinner-overlay";
import Header from "./core/header";
import { GoalComponent } from "./first-time-goals/goal-card";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Crypto from "expo-crypto";
import { shareAsync } from "expo-sharing";
import Icon from "react-native-vector-icons/FontAwesome6";
import { createArchivedGrade } from "@/firebase-config/firebase-history";
import { readAllDocuments } from "@/firebase-config/firebase-generic";
import { getNowDJ } from "@/utils/dates";

interface CategoryScreenProps {
  selectedCategory: CategoryDocument;
}

export default function CategoryScreen({
  selectedCategory,
}: CategoryScreenProps) {
  const { currentUser, createGoalsOnFireStore, updateGoalsOnFireStore } =
    useCurrentUser();
  const [savingGrade, setSavingGrade] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);
  const [goals, setGoals] = useState<GoalDocument[] | null>(null);
  const [relatedGoals, setRelatedGoals] = useState<GoalDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const viewShotRef = useRef();
  const [isFetchingGoals, setIsFetchingGoals] = useState<boolean>(false);
  useState<boolean>(false);

  // Update goals on component mount or when currentUser or selectedCategory changes
  useEffect(() => {
    // Fetch goals related to the selected category
    if (currentUser.goals && currentUser.goals.length) {
      const filteredGoals = currentUser.goals.filter((goal) => {
        return goal.categoryId === selectedCategory.id;
      });

      if (filteredGoals.length > 1 && filteredGoals.length <= 5) {
        setGoals(filteredGoals);
      } else {
        setGoals(null);
      }
    }
    // Initialize related goals if goals are null or fewer than 3
    if (!goals || goals.length < 1) {
      async function fetchGoals() {
        setIsFetchingGoals(true); // Start loading
        try {
          const fetchedGoals = await readAllDocuments<GoalDocument[]>(
            "initial-goals",
            {
              filters: [
                {
                  field: "categoryId",
                  operator: "==",
                  value: selectedCategory.name,
                },
              ],
            }
          );
          setRelatedGoals(fetchedGoals as GoalDocument[]);
        } catch (error) {
          console.error("Error fetching goals:", error);
        } finally {
          setIsFetchingGoals(false); // End loading
        }
      }
      fetchGoals();
    }
  }, [currentUser.goals, selectedCategory.id]);

  const handleUpdateGoal = async (updatedGoal: GoalDocument) => {
    setSavingGrade(true);
    try {
      await updateGoalsOnFireStore([updatedGoal]);
      const archievedGrade: ArchievedGrade = {
        name: updatedGoal.name,
        color: selectedCategory.color,
        grade: updatedGoal.grade,
        gradedAt: getNowDJ().toDate(),
        icon: selectedCategory.icon,
        id: updatedGoal.id,
        type: "goal",
        userId: currentUser.id,
      };
      await createArchivedGrade(archievedGrade);
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

  const handleGradeChange = (goalId: string, grade: number) => {
    setRelatedGoals((prevGoals) =>
      prevGoals.map((goal) => (goal.id === goalId ? { ...goal, grade } : goal))
    );
  };

  const handleTaskChange = (goalId: string, tasks: string) => {
    setRelatedGoals((prevGoals) =>
      prevGoals.map((goal) => (goal.id === goalId ? { ...goal, tasks } : goal))
    );
  };

  const handleToggleActive = (goalId: string) => {
    setRelatedGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === goalId ? { ...goal, active: !goal.active } : goal
      )
    );
  };

  const handleSaveGoals = async () => {
    setLoading(true);
    try {
      const newGoals = relatedGoals.map((goal) => ({
        ...goal,
        grade: goal.grade > 5 ?  5 : goal.grade,
        categoryId: selectedCategory.id,
        id: Crypto.randomUUID(),
      }));
      await createGoalsOnFireStore(newGoals);

      newGoals.forEach(async updatedGoal => {
        const archievedGrade: ArchievedGrade = {
          name: updatedGoal.name,
          color: selectedCategory.color,
          grade: updatedGoal.grade > 5 ? 5 : updatedGoal.grade,
          gradedAt: getNowDJ().toDate(),
          icon: selectedCategory.icon,
          id: updatedGoal.id,
          type: "goal",
          userId: currentUser.id,
        };
        await createArchivedGrade(archievedGrade);
      })

    } catch (err) {
      Toast.show({
        type: "error",
        text1: "אוי לא!",
        text2: "שגיאה בעת שמירת המטרות!",
      });
      console.error("Error saving goals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      // Wait for a short moment to ensure the component is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 100));
      const uri = await captureRef(viewShotRef, {
        format: "jpg",
        quality: 1,
      });

      await shareAsync(uri);
    } catch (error) {
      console.error("Error sharing the image", error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <View className="w-full h-screen justify-center items-center p-4">
      <Spinner
        visible={savingGrade || sharing || isFetchingGoals}
        textContent={
          sharing
            ? "משתף"
            : savingGrade
              ? "שומר דירוג"
              : isFetchingGoals
                ? "טוען מטרות רלוונטיות.."
                : ""
        }
        textStyle={{ color: "#FFF" }}
      />
      {goals && goals.length >= 3 ? (
        <View className="flex-1 mt-12">
          <Toast position="top" />
          {!sharing && (
            <Header
              showBorder={false}
              showLogo={false}
              label={selectedCategory.name}
              showMenu={false}
            />
          )}
          <View className="flex-1 justify-center items-center">
            <ViewShot style={{ backgroundColor: "white" }} ref={viewShotRef}>
              {sharing && (
                <Header
                  label={selectedCategory.name}
                  showBorder={false}
                  showLogo={false}
                  showMenu={false}
                />
              )}
              <View style={{ paddingVertical: 20 }}>
                <SubCircle
                  category={selectedCategory}
                  goals={goals.filter((goal) => goal.active)}
                  onUpdateGoal={handleUpdateGoal}
                />
              </View>
            </ViewShot>
          </View>
          <View className="justify-center items-center">
            <Pressable
              className="mb-5 px-4 py-2 rounded-md flex flex-row justify-center items-center gap-x-2 bg-slate-200 shadow"
              onPress={handleShare}
            >
              <Icon name="share-from-square" size={24} color="#1E90FF" />
              <Text className="text-center">
                שיתוף מעגל ה{selectedCategory.name} שלי
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ alignItems: "center" }}
          className="w-full flex-1 p-4 mt-28"
        >
          <Text className="mb-8 text-3xl font-bold">{selectedCategory.name}</Text>
          <View className="w-full max-w-md">
            <Text className="text-center text-lg mb-6">
              על מנת לשפר את התחום הזה בחייך עלייך לבחור עד ל3 מטרות ולפרק כל
              אחת מהן למשימות לביצוע. אנא בחר לפחות מטרה אחת מהכתוב למטה. יש
              באפשרותך לשנות את המטרה אם תרצה.
            </Text>
            <View className="w-full justify-center items-center gap-y-5">
              {relatedGoals.map((goal, index) => (
                <GoalComponent
                  key={index}
                  goal={goal}
                  onGradeChange={handleGradeChange}
                  onTaskChange={handleTaskChange}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </View>
            <View className="mt-8">
              <Pressable
                disabled={loading}
                onPress={handleSaveGoals}
                className="w-full py-3 mb-12 px-6 bg-blue-700 rounded-lg shadow-md"
              >
                <Text className="text-white text-center text-lg font-semibold">
                  המשך
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
