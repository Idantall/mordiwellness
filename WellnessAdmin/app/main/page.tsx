import DashboardClient from "./client";
import { getDocuments } from "@/app/utils/firestore";
import { API_URL, serverConfig } from "@/firebase";
import { getAccessTokenFromCookies } from "@/firebase/token";
import { Account, CategoryDocument, ArchievedGrade } from "@/types";
import axios from "axios";

interface InitialStats {
    averageGrade: number;
    categoryStats: {
        better: string[];
        worse: string[];
        improved: string[];
    };
    chartData: { name: string; avgGrade: number }[];
}

interface InitialData {
    categories: CategoryDocument[];
    accounts: Account[];
    archivedGrades: ArchievedGrade[];
    initialStats: InitialStats;
    cities: string[];
}

async function getInitialData(
    accessToken: string | null
): Promise<InitialData> {
    try {
        const categories: CategoryDocument[] = await getDocuments(accessToken!, "initial-categories");
        const citiesRes = await axios.get(
            `${API_URL}/api/storage?path=docs/cities.json`,
            {
                headers: {
                    "Cache-Control": "max-age=3600",
                    "Authorization": `Bearer ${accessToken}`
                },
                withCredentials: true
            }
        );
        const cities: string[] = citiesRes.data;

        const accounts: Account[] = await getDocuments(accessToken!, "users");
        const archivedGrades: ArchievedGrade[] = await getDocuments(
            accessToken!,
            "archived-grades"
        );


        const averageGrade = calculateAverageGrade(accounts);
        const categoryStats = calculateCategoryStats(
            accounts,
            categories,
            archivedGrades
        );
        const chartData = calculateChartData(accounts, categories);

        return {
            categories,
            accounts,
            archivedGrades,
            initialStats: {
                averageGrade,
                categoryStats,
                chartData,
            },
            cities,
        };
    } catch (error) {
        console.error("Error fetching initial data:", error);
        return {
            categories: [],
            accounts: [],
            archivedGrades: [],
            initialStats: {
                averageGrade: 0,
                categoryStats: { better: [], worse: [], improved: [] },
                chartData: [],
            },
            cities: [],
        };
    }
}

function calculateAverageGrade(accounts: Account[]): number {
    if (accounts.length === 0) return 0;

    const sum = accounts.reduce((acc, account) => {
        if (Array.isArray(account.categories)) {
            return (
                acc +
                account.categories.reduce(
                    (sum, cat) => sum + (cat.grade || 0),
                    0
                )
            );
        }
        return acc;
    }, 0);

    const totalCategories = accounts.reduce(
        (acc, account) =>
            acc +
            (Array.isArray(account.categories) ? account.categories.length : 0),
        0
    );
    return totalCategories > 0 ? sum / totalCategories : 0;
}

function calculateCategoryStats(
    accounts: Account[],
    categories: CategoryDocument[],
    archivedGrades: ArchievedGrade[]
) {
    const stats = categories.map((category) => {
        const relevantAccounts = accounts.filter((account) =>
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
                (grade) =>
                    grade.userId === account.id && grade.name === category.name
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
}

function calculateChartData(
    accounts: Account[],
    categories: CategoryDocument[]
) {
    return categories.map((category) => {
        const avgGrade =
            accounts.reduce((sum, account) => {
                const catGrade =
                    account.categories?.find((c) => c?.name === category.name)
                        ?.grade || 0;
                return sum + catGrade;
            }, 0) / (accounts.length || 1);
        return { name: category.name, avgGrade };
    });
}

export default async function DashboardPage() {
    const token = await getAccessTokenFromCookies();
    const initialData = await getInitialData(token);
    return <DashboardClient {...initialData} />;
}
