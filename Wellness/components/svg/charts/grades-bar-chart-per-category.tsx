import React, { useMemo } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
} from "victory-native";
import { ArchievedGrade, CategoryDocument } from "@/types";
import { getDateDJ, getNowDJ } from "@/utils/dates";
import dayjs, { Dayjs } from "dayjs";

interface GradeBarChartProps {
  archievedGrades: ArchievedGrade[];
  error: boolean;
  loading: boolean;
  width: number;
  height: number;
  category: CategoryDocument;
  chartConfig: {};
  comparisonType?: "day" | "week" | "month";
}

export default function GradeBarChart(props: GradeBarChartProps) {
  const {
    width,
    height,
    loading,
    error,
    archievedGrades,
    category,
    comparisonType = "day",
  } = props;

  const aspectRatio = 1.6;
  const chartWidth = width;
  const barWidth = 15;
  const chartHeight = Math.min(height, width / aspectRatio);

  const { beforeLastGrade, lastGrade, averageGrade } = useMemo(() => {
    const sortedGrades = [...archievedGrades];
    sortedGrades.sort((a, b) => {
      const aDate = (a.gradedAt as any).toDate();
      const bDate = (b.gradedAt as any).toDate();
      const aDateDJ = getDateDJ(aDate);
      const bDateDJ = getDateDJ(bDate);

      return bDateDJ.diff(aDateDJ);
    });

    const undefGrade = {
      name: category.name,
      color: category.color,
      grade: 0.2,
    };
    const lastGrade = sortedGrades[0] ?? undefGrade;
    const beforeLastGrade = sortedGrades[1] ?? undefGrade;
    const averageGrade = {
      color: category.color,
      name: category.name,
      grade:
        sortedGrades.length === 0
          ? 0.2
          : sortedGrades.reduce((acc, grade) => acc + grade.grade, 0) /
            sortedGrades.length,
    };

    return { lastGrade, beforeLastGrade, averageGrade };
  }, [archievedGrades]);

  if (loading) {
    return (
      <View
        style={{ width: chartWidth, height: chartHeight }}
        className="items-center justify-center"
      >
        <ActivityIndicator color="blue" />
        <Text>טוען מידע אודות דירוגים...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{ width: chartWidth, height: chartHeight }}
        className="items-center justify-center bg-white p-4 rounded-lg"
      >
        <Text className="text-red-600">
          שגיאה בטעינת דירוגים. נסה שוב מאוחר יותר.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: chartWidth,
        height: chartHeight,
        maxHeight: chartHeight,
      }}
      className="justify-center items-center"
    >
      <VictoryChart
        theme={VictoryTheme.material}
        domain={{ x: [-3, 7] }}
        width={chartWidth}
        height={chartHeight}
        padding={{
          top: chartHeight * 0.1,
          bottom: chartHeight * 0.2,
          left: chartWidth * 0.15,
          right: chartWidth * 0.05,
        }}
      >
        {/* X-Axis */}
        <VictoryAxis
          tickFormat={(t) => t}
          style={{
            tickLabels: {
              angle: -45,
              textAnchor: "end",
              fontSize: Math.min(10, chartWidth / 40),
            },
          }}
        />

        {/* Y-Axis */}
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => t}
          domain={[0, 5]}
          offsetX={chartWidth * 0.15}
          style={{
            grid: { stroke: "#ECEFF1", strokeWidth: 1 },
            tickLabels: { fontSize: Math.min(10, chartWidth / 40) },
          }}
        />

        <VictoryBar
          data={[{ x: "אחרון", y: beforeLastGrade.grade }]}
          style={{ data: { fill: "#e74c3c", fillOpacity: 1 } }}
          barWidth={barWidth}
        />

        <VictoryBar
          data={[{ x: "ממוצע", y: averageGrade.grade }]}
          style={{ data: { fill: "yellow", fillOpacity: 1 } }}
          barWidth={barWidth}
          alignment="middle"
        />

        <VictoryBar
          data={[{ x: "נוכחי", y: lastGrade.grade }]}
          style={{ data: { fill: "#2ecc71", fillOpacity: 1 } }}
          barWidth={barWidth}
          alignment="middle"
        />
      </VictoryChart>
    </View>
  );
}
