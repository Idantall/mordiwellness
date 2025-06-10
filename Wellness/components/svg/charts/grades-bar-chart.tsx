import React, { useMemo } from "react";
import { View, ActivityIndicator, Text, Dimensions } from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
} from "victory-native";
import { ArchievedGrade } from "@/types";
import { isWithinInterval, differenceInMilliseconds } from "date-fns";
import { Dayjs } from "dayjs";

interface GradesBarChartProps {
  archievedGrades: ArchievedGrade[];
  loading: boolean;
  error: boolean | null;
  isRefetching: boolean;
  onRefetch: () => void;
  chartConfig: object;
  selectedDate: Dayjs;
}

const screenWidth = Dimensions.get("screen").width;

export default function GradesBarChart(props: GradesBarChartProps) {
  const getClosestGradeData = useMemo(() => {
    // Get the start and end of the selected month
    const startOfSelectedMonth = props.selectedDate.startOf("month");
    const endOfSelectedMonth = props.selectedDate.endOf("month");
    const today = new Date();
    // Filter grades for the selected month and only category types
    const filteredGrades = props.archievedGrades.filter(
      (archievedGrade) =>
        archievedGrade.type === "category" &&
        isWithinInterval((archievedGrade.gradedAt as any).toDate(), {
          start: startOfSelectedMonth.toDate(),
          end: endOfSelectedMonth.toDate(),
        })
    );
    
    // Group grades by category name
    const groupedGrades = filteredGrades.reduce(
      (acc, curr) => {
        if (!acc[curr.name]) {
          acc[curr.name] = [];
        }
        acc[curr.name].push(curr);
        return acc;
      },
      {} as Record<string, ArchievedGrade[]>
    );
    
    // For each category, find the grade with the closest date to today
    const closestData = Object.keys(groupedGrades).map((categoryName) => {
      const grades = groupedGrades[categoryName];
      
      // Sort by date difference to find closest
      grades.sort((a, b) => {
        const aDiff = Math.abs(
          differenceInMilliseconds(
            (a.gradedAt as any).toDate(),
            today
          )
        );
        const bDiff = Math.abs(
          differenceInMilliseconds(
            (b.gradedAt as any).toDate(),
            today
          )
        );
        return aDiff - bDiff;
      });
      
      // Take the first one (closest to today)
      const closestGrade = grades[0];
      
      return {
        name: categoryName,
        grade: closestGrade.grade.toFixed(0),
        color: closestGrade.color,
        id: closestGrade.id
      };
    });
    
    return closestData;
    }, [props.archievedGrades, props.selectedDate]);

  if (props.loading) {
    return (
      <View className="items-center">
        <ActivityIndicator color="blue" />
        <Text>טוען מידע אודות דירוגים...</Text>
      </View>
    );
  }

  if (props.error) {
    return (
      <View className="items-center bg-white p-4 rounded-lg">
        <Text className="text-red-600">
          שגיאה בטעינת דירוגים. נסה שוב מאוחר יותר.
        </Text>
      </View>
    );
  }

  if (getClosestGradeData.length < 1) {
    return (
      <View
        style={{
          width: screenWidth - 40,
          height: 220,
          borderRadius: 16,
        }}
        className="items-center justify-center bg-white"
      >
        <Text className="text-gray-400 text-lg">
          אין דירוגים כרגע בנקודת הזמן הזו!
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{ position: "relative", width: screenWidth - 40, height: 220 }}
    >
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={{ x: 30 }}
        width={screenWidth - 40}
        height={220}
      >
        <VictoryAxis
          tickFormat={(t) => t}
          style={{
            tickLabels: {
              angle: -45,
              textAnchor: "end",
              fontSize: 8,
            },
          }}
        />
        <VictoryAxis dependentAxis tickFormat={(t) => t} domain={[0, 5]} />
        <VictoryBar
          data={getClosestGradeData.map(({ name, grade }) => ({
            x: name,
            y: parseFloat(grade),
            fill:
              props.archievedGrades.find((g) => g.name === name)?.color ||
              "#007AFF",
          }))}
          style={{ data: { fill: ({ datum }) => datum.fill } }}
        />
      </VictoryChart>
      {props.isRefetching && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: 16,
          }}
        >
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
}
