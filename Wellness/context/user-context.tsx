import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateDocument, readDocument } from "@/firebase-config/firebase-generic";
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import {
  getFirestoreUser,
  ObserveAuthState,
  createFirestoreUser,
  uploadProfilePicture,
} from "@/firebase-config/firebase-auth";
import {
  Account,
  AccountRegisterCredentionals,
  CategoryDocument,
  GoalDocument,
  SummaryInfo,
  MoodEmoji,
  AccountWithFilteredCategories,
} from "types";

interface UserContextResults {
  currentUser: AccountWithFilteredCategories | null;
  loading: boolean;
  authenticated: boolean | null;
  findCategoryById: (categoryId: string) => CategoryDocument;
  updateCredentialsOnState: (updatedCredentials: any) => void;
  updateCategoriesOnState: (updatedCategories: CategoryDocument[]) => void;
  updateCategoriesOnFireStore: (
    categories: CategoryDocument[]
  ) => Promise<void>;
  updateCategoryGrades: (summaryInfo: SummaryInfo[]) => Promise<void>;
  markUserAsNotNew: () => Promise<void>;
  registerFCMToken: (fcmToken: string) => Promise<void>;
  createGoalsOnFireStore: (goals: GoalDocument[]) => Promise<void>;
  updateGoalsOnFireStore: (goals: GoalDocument[]) => Promise<void>;
  updateGoalsOnState: (updatedGoals: GoalDocument[]) => void;
  updateCurrentMood: (newMood: MoodEmoji) => Promise<void>;
  fetchCurrentMood: () => Promise<MoodEmoji | null>;
  updateUserAgeCategories: (age: number) => void;
}

const Context = createContext<UserContextResults | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] =
    useState<AccountWithFilteredCategories | null>(null);
  const [originalCategories, setOriginalCategories] = useState<
    CategoryDocument[] | null
  >(null);
  const router = useRouter();

  useEffect(() => {
    if (currentUser?.categories) {
      setOriginalCategories(currentUser.categories);
    }
  }, [currentUser?.categories]);

  const loadCredentialsFromStorage =
    async (): Promise<AccountRegisterCredentionals | null> => {
      try {
        const storedCredentials = await AsyncStorage.getItem("userCredentials");
        return storedCredentials ? JSON.parse(storedCredentials) : null;
      } catch (error) {
        console.error("Error loading credentials from storage", error);
        return null;
      }
    };

  const clearCredentialsFromStorage = async () => {
    try {
      await AsyncStorage.removeItem("userCredentials");
    } catch (error) {
      console.error("Error clearing credentials from storage", error);
    }
  };

  const findCategoryById = (categoryId: string) => {
    return currentUser.categories.find(
      (category) => category.id === categoryId
    );
  };

  const updateCategoriesOnFireStore = async (
    categories: CategoryDocument[]
  ) => {
    if (currentUser) {
      try {
        await updateDocument("users", currentUser.id, { categories });
      } catch (error) {
        console.error("Error updating categories on Firestore:", error);
      }
    }
  };

  const filterCategoriesByAge = (
    categories: CategoryDocument[],
    age: number
  ) => {
    return categories.filter((category) => {
      if (category.name === "הורות") {
        return age >= 18;
      }
      return true;
    });
  };

  const updateCategoriesOnState = (updatedCategories: CategoryDocument[]) => {
    setCurrentUser((prev) => {
      const filteredCategories = filterCategoriesByAge(
        updatedCategories,
        prev.age
      );
      return { ...prev, categories: updatedCategories, filteredCategories };
    });
  };

  const updateGoalsOnState = (updatedGoals: GoalDocument[]) => {
    if (currentUser) {
      setCurrentUser((prev) => {
        const newGoals = [...prev.goals];
        updatedGoals.forEach((updatedGoal) => {
          const index = newGoals.findIndex((g) => g.id === updatedGoal.id);
          if (index !== -1) {
            newGoals[index] = updatedGoal;
          } else {
            newGoals.push(updatedGoal);
          }
        });
        return { ...prev, goals: newGoals };
      });
    }
  };

  const createGoalsOnFireStore = async (goals: GoalDocument[]) => {
    if (currentUser) {
      try {
        const updatedGoals = [...currentUser.goals, ...goals];
        await updateDocument("users", currentUser.id, { goals: updatedGoals });
        updateGoalsOnState(goals);
      } catch (error) {
        console.error("Error creating goals on Firestore:", error);
      }
    }
  };

  const updateGoalsOnFireStore = async (goals: GoalDocument[]) => {
    if (currentUser) {
      try {
        const updatedGoals = currentUser.goals.map((existingGoal) => {
          const updatedGoal = goals.find((g) => g.id === existingGoal.id);
          return updatedGoal || existingGoal;
        });
        await updateDocument("users", currentUser.id, { goals: updatedGoals });
        updateGoalsOnState(goals);
      } catch (error) {
        console.error("Error updating goals on Firestore:", error);
      }
    }
  };

  const filterCategories = (
    currentUser: Account
  ): AccountWithFilteredCategories => {
    if (currentUser.categories) {
      const shouldShowParenting = currentUser.age >= 18;
      const parentingCategory = originalCategories?.find(
        (cat) => cat.name === "הורות"
      );

      if (shouldShowParenting) {
        const updatedCategories = [
          ...currentUser.categories,
          parentingCategory,
        ];
        return {
          ...currentUser,
          filteredCategories: updatedCategories.filter(c => c !== undefined),
        };
      } else if (!shouldShowParenting) {
        const updatedCategories = currentUser.categories.filter(
          (category) => category.name !== "הורות"
        );
        return {
          ...currentUser,
          filteredCategories: updatedCategories.filter(c => c !== undefined),
        };
      }
    }

    return {
      ...currentUser,
      filteredCategories: currentUser.categories.filter(
        (c) => c !== undefined
      ),
    };
  };

  const updateCategoryGrades = async (summaryInfo: SummaryInfo[]) => {
    if (!currentUser) return;

    const updatedCategories = currentUser.categories.map((category) => {
      const info = summaryInfo.find(
        (info) => info.question.categoryName === category.name
      );
      if (info) {
        return { ...category, grade: info.selctedOption.grade };
      }
      return category;
    });

    setCurrentUser((prev) => ({
      ...prev,
      categories: updatedCategories,
      new: false,
    }));
    await updateCategoriesOnFireStore(updatedCategories);
  };

  const markUserAsNotNew = async () => {
    if (!currentUser || !currentUser.new) return;
    try {
      setCurrentUser((prev) => ({ ...prev, new: false }));
      await updateDocument("users", currentUser.id, { new: false });
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const updateCredentialsOnState = (updatedCredentials: any) => {
    setCurrentUser((prev) => ({ ...prev, ...updatedCredentials }));
  };

  const updateUserAgeCategories = (age: number) => {
    if (currentUser.categories) {
      const shouldShowParenting = age >= 18;


      const hasParentingCategory = currentUser.filteredCategories.some(
        (category) => category.name === "הורות"
      );

      const parentingCategory = originalCategories?.find(
        (cat) => cat.name === "הורות"
      );

      if (shouldShowParenting && !hasParentingCategory) {
        console.log("Entered 1");
        const updatedCategories = [
          ...currentUser.filteredCategories,
          parentingCategory,
        ];
        setCurrentUser((prev) => ({
          ...prev,
          filteredCategories: updatedCategories,
        }));
      } else if (!shouldShowParenting && hasParentingCategory) {
        console.log("Entered 2");
        const updatedCategories = currentUser.categories.filter(
          (category) => category.name !== "הורות"
        );
        setCurrentUser((prev) => ({
          ...prev,
          filteredCategories: updatedCategories,
        }));
      }
    }
  };

  const registerFCMToken = async (fcmToken: string) => {
    if (currentUser) {
      try {
        await updateDocument("users", currentUser.id, { fcmToken });
        console.log("FCM token registered successfully");
      } catch (error) {
        console.error("Error registering FCM token:", error);
      }
    }
  };

  const updateCurrentMood = async (newMood: MoodEmoji) => {
    if (currentUser) {
      try {
        // Update current mood in state
        setCurrentUser((prev) => ({ ...prev, currentMood: newMood }));

        // Update current mood in Firestore
        await updateDocument("users", currentUser.id, { currentMood: newMood });

        console.log("Mood updated and statistics saved successfully");
      } catch (error) {
        console.error("Error updating mood and saving statistics:", error);
      }
    }
  };

  const fetchCurrentMood = async (): Promise<MoodEmoji | null> => {
    if (currentUser) {
      try {
        const userDoc = await readDocument<Account>("users", currentUser.id);
        return userDoc?.currentMood || null;
      } catch (error) {
        console.error("Error fetching current mood:", error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = ObserveAuthState(async (user) => {
      setLoading(true);
      try {
        if (user) {
          try {
            const firestoreUser = await getFirestoreUser(user.uid);
            const filteredUser = filterCategories(firestoreUser);
            setAuthenticated(true);
            setCurrentUser(filteredUser);
            setOriginalCategories(filteredUser.categories);
            await clearCredentialsFromStorage();
            router.push("/main");
          } catch {
            const loadedCredentials = await loadCredentialsFromStorage();
            if (loadedCredentials) {
              try {
                const profilePictureUrl = loadedCredentials.profilePictureUrl
                  ? await uploadProfilePicture(
                      loadedCredentials.profilePictureUrl
                    )
                  : null;
                const firestoreUser = await createFirestoreUser({
                  ...loadedCredentials,
                  id: user.uid,
                  profilePictureUrl,
                });
                const filteredUser = filterCategories(firestoreUser);
                setAuthenticated(true);
                setOriginalCategories(filteredUser.categories);
                setCurrentUser(filteredUser);
                await clearCredentialsFromStorage();
                router.push("/main");
              } catch (err) {
                setAuthenticated(false);
                setCurrentUser(null);
                router.push("/auth");
              }
            } else {
              console.log("No credentials are stored");
              setAuthenticated(false);
              setCurrentUser(null);
              router.push("/auth");
            }
          }
        } else {
          console.log("No user is authenticated");
          setAuthenticated(false);
          setCurrentUser(null);
          router.push("/auth");
        }
      } catch (err) {
        console.log("Unexpected error in authentication flow:", err);
        setAuthenticated(false);
        setCurrentUser(null);
        router.push("/auth");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <Context.Provider
      value={{
        currentUser,
        loading,
        authenticated,
        updateCategoriesOnState,
        updateCategoriesOnFireStore,
        updateCategoryGrades,
        markUserAsNotNew,
        findCategoryById,
        updateCredentialsOnState,
        registerFCMToken,
        createGoalsOnFireStore,
        updateGoalsOnFireStore,
        updateGoalsOnState,
        updateCurrentMood,
        fetchCurrentMood,
        updateUserAgeCategories,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useCurrentUser = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useCurrentUser must be used within a UserProvider");
  }
  return context;
};
