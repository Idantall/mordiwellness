"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Account, ArchievedGrade, CategoryDocument } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface DashboardClientProps {
  categories: Partial<CategoryDocument>[];
  accounts: Account[];
  archivedGrades: ArchievedGrade[];
  initialStats: {
    averageGrade: number;
    categoryStats: {
      better: string[];
      worse: string[];
      improved: string[];
    };
    chartData: { name: string; avgGrade: number }[];
  };
  cities: string[];
}

const DashboardClient: React.FC<DashboardClientProps> = ({
  categories,
  accounts: initialAccounts,
  archivedGrades,
  initialStats,
  cities,
}) => {
  const [ageRange, setAgeRange] = useState<string>("all");
  const [gender, setGender] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const accountsQuery = useMemo(() => {
    let q = initialAccounts;
    if (ageRange !== "all") {
      const [min, max] = ageRange.split("-").map(Number);
      q = q.filter((account) => account.age >= min && account.age <= max);
    }
    if (gender !== "all") {
      q = q.filter((account) => account.gender === gender);
    }
    if (city !== "all") {
      q = q.filter((account) => account.city === city);
    }
    return q;
  }, [ageRange, gender, city, initialAccounts]);

  useEffect(() => {
    setIsLoading(true);
    try {
      setAccounts(accountsQuery);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        if (err.message.includes("401")) {
          toast({
            title: "שגיאה",
            description: "לא מורשה - אנא התחבר מחדש.",
          });
        } else if (err.message.includes("500")) {
          toast({
            title: "שגיאה",
            description: "שגיאת שרת - אנא נסה שוב מאוחר יותר.",
          });
        } else {
          toast({
            title: "שגיאה",
            description: "אירעה שגיאה בטעינת הנתונים.",
          });
        }
      } else {
        setError(new Error("Failed to filter accounts"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [accountsQuery, toast]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(Boolean);
  }, [accounts]);

  const averageGrade = useMemo(() => {
    if (filteredAccounts.length === 0) return initialStats.averageGrade;
    const sum = filteredAccounts.reduce((acc, account) => {
      const categories = account.categories || [];
      return acc + categories.reduce((sum, cat) => sum + (cat?.grade || 0), 0);
    }, 0);
    const totalCategories = filteredAccounts.reduce(
      (acc, account) => acc + (account.categories?.length || 0),
      0
    );
    return totalCategories > 0
      ? sum / totalCategories
      : initialStats.averageGrade;
  }, [filteredAccounts, initialStats]);

  const categoryStats = useMemo(() => {
    const effectiveCategories =
      categories.length > 0
        ? categories
        : filteredAccounts.flatMap((account) => account.categories || []);

    if (!effectiveCategories || !archivedGrades)
      return initialStats.categoryStats;

    const stats = effectiveCategories.map((category) => {
      const relevantAccounts = filteredAccounts.filter((account) =>
        account.categories?.some((cat) => cat?.name === category.name)
      );

      const highGrades = relevantAccounts.filter((account) => {
        const categoryGrade = account.categories?.find(
          (cat) => cat?.name === category.name
        )?.grade;
        return typeof categoryGrade === "number" && categoryGrade >= 4;
      }).length;

      const lowGrades = relevantAccounts.filter((account) => {
        const categoryGrade = account.categories?.find(
          (cat) => cat?.name === category.name
        )?.grade;
        return typeof categoryGrade === "number" && categoryGrade <= 3;
      }).length;

      const improved = relevantAccounts.filter((account) => {
        const currentCat = account.categories?.find(
          (c) => c?.name === category.name
        );
        if (!currentCat) return false;

        const archivedGrade = archivedGrades.find(
          (grade) => grade.userId === account.id && grade.name === category.name
        );

        return archivedGrade && currentCat.grade > archivedGrade.grade;
      }).length;

      const total = relevantAccounts.length || 1;

      return {
        name: category.name,
        highPercentage: (highGrades / total) * 100,
        lowPercentage: (lowGrades / total) * 100,
        improvedPercentage: (improved / total) * 100,
      };
    });

    return {
      better: stats
        .filter((stat) => stat.highPercentage > 50)
        .map((stat) => stat.name),
      worse: stats
        .filter((stat) => stat.lowPercentage > 50)
        .map((stat) => stat.name),
      improved: stats
        .filter((stat) => stat.improvedPercentage > 50)
        .map((stat) => stat.name),
    };
  }, [categories, filteredAccounts, archivedGrades, initialStats]);

  const chartData = useMemo(() => {
    // Fallback to categories from user data if categories prop is empty
    const effectiveCategories =
      categories.length > 0
        ? categories
        : filteredAccounts.flatMap((account) => account.categories || []);

    if (!effectiveCategories) return initialStats.chartData;

    return effectiveCategories.map((category) => {
      const avgGrade =
        filteredAccounts.reduce((sum, account) => {
          const catGrade =
            account.categories?.find((c) => c?.name === category.name)?.grade ||
            0;
          return sum + catGrade;
        }, 0) / (filteredAccounts.length || 1);
      return { name: category.name, ציון: avgGrade !== 0 ? avgGrade.toFixed(1) : 0 };
    });
  }, [categories, filteredAccounts, initialStats]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 rtl" dir="rtl">
        <h1 className="text-3xl font-bold mb-6">לוח בקרה</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-[250px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[100px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>שגיאה</AlertTitle>
        <AlertDescription>
          אירעה שגיאה בטעינת הנתונים. אנא נסה שוב מאוחר יותר.
          {error && <p>שגיאה: {error.message}</p>}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4 rtl" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">לוח בקרה</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select value={ageRange} onValueChange={setAgeRange}>
          <SelectTrigger>
            <SelectValue placeholder="טווח גילאים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הגילאים</SelectItem>
            <SelectItem value="18-25">18-25</SelectItem>
            <SelectItem value="26-35">26-35</SelectItem>
            <SelectItem value="36-50">36-50</SelectItem>
            <SelectItem value="51+">51+</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger>
            <SelectValue placeholder="מגדר" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל המגדרים</SelectItem>
            <SelectItem value="male">זכר</SelectItem>
            <SelectItem value="female">נקבה</SelectItem>
          </SelectContent>
        </Select>

        <Select value={city} onValueChange={setCity}>
          <SelectTrigger>
            <SelectValue placeholder="עיר" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הערים</SelectItem>
            {cities.map((cityName, index) => (
              <SelectItem key={index} value={cityName}>
                {cityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>ציון ממוצע של מעגל החיים</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{averageGrade.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>קטגוריות שדורגו גבוה</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {categoryStats.better.length > 0 ? (
                categoryStats.better.map((cat, index) => (
                  <li key={index}>{cat}</li>
                ))
              ) : (
                <li>אין קטגוריות טובות יותר</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>קטגוריות שדורגו נמוך</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {categoryStats.worse.length > 0 ? (
                categoryStats.worse.map((cat, index) => (
                  <li key={index}>{cat}</li>
                ))
              ) : (
                <li>אן קטגוריות גרועות יותר</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>קטגוריות שהשתפרו</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {categoryStats.improved.length > 0 ? (
                categoryStats.improved.map((cat, index) => (
                  <li key={index}>{cat}</li>
                ))
              ) : (
                <li>אין קטגוריות שהשתפרו</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>התפלגות ציונים לפי קטגוריה</CardTitle>
        </CardHeader>
        <CardContent className="w-full flex justify-center items-center h-[400px]">
          {chartData.length > 0 ? (
            <div className="flex justify-center items-center w-full h-full">
              <BarChart width={1200} height={400} data={chartData}>
                <XAxis dataKey="name" />
                <YAxis domain={[1, 5]} />
                <Bar width={20} dataKey="ציון" className="fill-primary" />
                <ChartTooltip />
              </BarChart>
            </div>
          ) : (
            <p>אין נתונים זמינים להצגה בתרשים</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardClient;
