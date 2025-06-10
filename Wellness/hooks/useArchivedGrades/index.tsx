import { getArchivedGrades } from "@/firebase-config/firebase-history";
import { QueryOptions } from "@/firebase-config/firebase-generic";
import { useQuery } from "react-query";

export function useArchivedGrades(options: QueryOptions) {
  const { data: archivedGrades, isLoading: loadingGrades, error, refetch, ...other } = useQuery({
    queryKey: ["archived-grades"],
    queryFn: async () => {
      const archivedGrades = await getArchivedGrades({ ...options });
      return archivedGrades;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return { archivedGrades, loadingGrades, error, refetch, ...other };
}
