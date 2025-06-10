import { CategoryDocument, GoalDocument } from "@/types";
import CategoriesTable from "./client";
import { getAccessTokenFromCookies } from "@/firebase/token";
import { getDocuments } from "@/app/utils/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function Categories() {
  const accessToken = await getAccessTokenFromCookies();

  try {
    const [categories, goals] = await Promise.all([
      getDocuments(accessToken!, "initial-categories") as Promise<CategoryDocument[]>,
      getDocuments(accessToken!, "initial-goals") as Promise<GoalDocument[]>,
    ]);

    if (!categories || categories.length === 0) {
      throw new Error("תיקיית קטגוריות ריקה.");
    }

    return (
      <CategoriesTable
        initialCategories={categories}
        initialGoals={goals}
        accessToken={accessToken!}
      />
    );
  } catch (error) {
    console.error("Failed to fetch categories or goals:", error);
    return (
      <Alert className="container mx-auto p-4 rtl" variant={"destructive"}>
        <AlertTitle>אופס!</AlertTitle>
        <AlertDescription>שגיאה בטעינת קטגוריות או מטרות</AlertDescription>
      </Alert>
    );
  }
}
