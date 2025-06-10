import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  readAllDocuments,
  createDocument,
  QueryOptions,
} from "../../firebase-config/firebase-generic";
import { MoodEntry, MoodEmoji } from "../../types";
import Toast from "react-native-toast-message";

interface UseMoodHistoryParams {
  userId: string;
}

interface MoodEntryWithId extends MoodEntry {
  id: string;
}

function useMoodHistory({ userId }: UseMoodHistoryParams) {
  const queryClient = useQueryClient();
  const queryOptions: QueryOptions = {
    filters: [{ field: "userId", operator: "==", value: userId }],
    orderByField: "chosenAt",
    orderDirection: "asc",
  };

  const { data, isLoading, error, refetch, ...other } = useQuery<
    MoodEntryWithId[],
    Error
  >(
    ["moodHistory", userId],
    async (): Promise<MoodEntryWithId[]> => {
      const data = await readAllDocuments<MoodEntry[]>(
        "mood-history",
        queryOptions
      );
      return data.map((entry) => ({
        ...entry,
        id: entry.id,
        chosenAt: entry.chosenAt.toDate(), // Convert Timestamp to Date
      })) as MoodEntryWithId[];
    },
    {
      staleTime: 0, // Always fetch fresh data
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: true, // Refetch on window focus
      refetchOnMount: true,
    }
  );

  const mutation = useMutation(
    async (newMood: MoodEmoji) => {
      const newEntry: MoodEntry = {
        emoji: newMood,
        chosenAt: new Date(),
        userId,
      };
      await createDocument("mood-history", newEntry);
      return newEntry;
    },
    {
      onSuccess: async () => {
        queryClient.invalidateQueries(["moodHistory", userId]);
        Toast.show({
          type: "success",
          text1: "היסטוריית מצב הרוח עודכנה בהצלחה",
        });
      },
      onError: () => {
        Toast.show({
          type: "error",
          text1: "שגיאה בעדכון היסטוריית מצב הרוח",
        });
      },
    }
  );

  return { data, isLoading, error, refetch, mutation, ...other };
}

export { useMoodHistory };
