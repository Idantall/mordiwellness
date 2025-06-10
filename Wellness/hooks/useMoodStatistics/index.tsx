import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  readAllDocuments,
  updateDocument,
  createDocument,
  QueryOptions,
} from "../../firebase-config/firebase-generic";
import { ArchievedMoodStatistic, MoodEmoji } from "../../types";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import { getDateDJ, getNowDJ } from "@/utils/dates";

interface UseMoodStatisticsParams {
  userId: string;
}

interface ArchivedMoodStatisticWithId extends ArchievedMoodStatistic {
  id: string;
}

function useMoodStatistics({ userId }: UseMoodStatisticsParams) {
  const queryClient = useQueryClient();
  const queryOptions: QueryOptions = {
    filters: [{ field: "userId", operator: "==", value: userId }],
    orderByField: "chosenAt",
    orderDirection: "asc",
  };

  const { data, isLoading, error, refetch } = useQuery<
    ArchivedMoodStatisticWithId[],
    Error
  >(
    ["moodStatistics", userId],
    async (): Promise<ArchivedMoodStatisticWithId[]> => {
      const data = await readAllDocuments<ArchievedMoodStatistic[]>(
        "mood-statistics",
        queryOptions
      );

      return data.map((stat) => ({
        ...stat,
        id: stat.id,
        date: getDateDJ(stat.date).toDate(),
      })) as ArchivedMoodStatisticWithId[];
    },
    {
      staleTime: 0, // Always fetch fresh data
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: true, // Refetch on window focus,
      refetchOnMount: true,
    }
  );

  const mutation = useMutation(
    async (newMood: MoodEmoji) => {
      const moodStatistics = await readAllDocuments<
        ArchivedMoodStatisticWithId[]
      >("mood-statistics", queryOptions);

      const existingStatistic = moodStatistics.find(
        (stat) => stat.emoji.image === newMood.image
      );

      if (existingStatistic) {
        const updatedStatistic = {
          ...existingStatistic,
          date: new Date(),
          timesChosen: existingStatistic.timesChosen + 1,
        } as ArchivedMoodStatisticWithId;
        await updateDocument(
          "mood-statistics",
          existingStatistic.id,
          updatedStatistic
        );
        return updatedStatistic;
      } else {
        // Create new statistic
        const newStatistic: ArchievedMoodStatistic = {
          emoji: newMood,
          timesChosen: 1,
          date: getNowDJ().toDate(),
          userId,
        };
        await createDocument("mood-statistics", newStatistic);
        return newStatistic;
      }
    },
    {
      onSuccess: async () => {
        queryClient.invalidateQueries(["moodStatistics", userId]);
        Toast.show({
          type: "success",
          text1: "סטטיסטיקת מצב הרוח עודכנה בהצלחה",
        });
      },
      onError: () => {
        Toast.show({
          type: "error",
          text1: "שגיאה בעדכון סטטיסטיקת מצב הרוח",
        });
      },
    }
  );

  return { data, isLoading, error, refetch, mutation };
}

export { useMoodStatistics };
