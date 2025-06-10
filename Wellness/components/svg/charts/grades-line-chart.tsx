import React, { useMemo } from "react";
import { View, Dimensions } from "react-native";
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryScatter,
} from "victory-native";
import { format, eachDayOfInterval } from "date-fns";
import { he } from "date-fns/locale";
import { ArchievedGrade } from "@/types";
import { Dayjs } from "dayjs";
import { getDateDJ } from "@/utils/dates";

const screenWidth = Dimensions.get("window").width;
const chartWidth = Math.floor(screenWidth - 40);
const chartHeight = 220;

interface LineChartComponentProps {
  archivedGrades: ArchievedGrade[];
  currentCategory: { name: string };
  loading: boolean;
  error: boolean | null;
  isRefetching: boolean;
  onRefetch: () => void;
  chartConfig: object;
  selectedDate: Dayjs;
  isHistoryFilterActive: boolean;
}

const LineChartComponent: React.FC<LineChartComponentProps> = ({
  archivedGrades,
  currentCategory,
  loading,
  error,
  chartConfig,
  selectedDate,
  isHistoryFilterActive,
}) => {
  const groupedAndAveragedGrades = useMemo(() => {
    if (!archivedGrades || !currentCategory) return [];

    const filteredGrades = archivedGrades
      .filter((grade: ArchievedGrade) => {
        const gradedAt = getDateDJ((grade.gradedAt as any).toDate());
        const startOfMonth = selectedDate.startOf("month");
        const endOfMonth = selectedDate.endOf("month");
        return (
          grade.name === currentCategory.name &&
          grade.type === "category" &&
          (isHistoryFilterActive ||
            (startOfMonth.isSameOrBefore(gradedAt) &&
              gradedAt.isSameOrBefore(endOfMonth)))
        );
      })
      .map((grade) => ({
        ...grade,
      }));

    if (!filteredGrades.length) return [];

    const daysInMonth = eachDayOfInterval({
      start: selectedDate.startOf("month").toDate(),
      end: selectedDate.endOf("month").toDate(),
    });

    const gradesByDay = daysInMonth.map((day) => {
      const dailyGrades = filteredGrades.filter((grade) => {
        const gradedAtDate = getDateDJ((grade.gradedAt as any).toDate()).startOf('day');
        const dayDate = getDateDJ(day).startOf('day');
        return (
          gradedAtDate.isSame(dayDate)
        );
      });

      const averageGrade =
        dailyGrades.length > 0
          ? dailyGrades.reduce((sum, g) => sum + g.grade, 0) /
            dailyGrades.length
          : null;

      console.log(averageGrade)

      return { key: format(day, "dd/MM"), grade: averageGrade };
    });

    return gradesByDay.filter(({ grade }) => grade !== null);
  }, [archivedGrades, currentCategory, selectedDate, isHistoryFilterActive]);

  const chartData = useMemo(() => {
    return groupedAndAveragedGrades.map(({ key, grade }) => ({
      x: key,
      y: grade,
    }));
  }, [groupedAndAveragedGrades]);

  if (loading || error) return null;

  return (
    <View style={{ width: chartWidth, height: chartHeight, marginVertical: 8 }}>
      <VictoryChart
        theme={VictoryTheme.material}
        width={chartWidth}
        height={chartHeight}
        domainPadding={{ x: 20, y: 20 }}
        domain={{ y: [1, 5] }}
        padding={{ top: 10, bottom: 50, left: 50, right: 20 }}
        containerComponent={
          <VictoryVoronoiContainer
            voronoiDimension="x"
            labels={({ datum }) => `${datum.y.toFixed(2)}`}
            labelComponent={
              <VictoryTooltip
                cornerRadius={5}
                flyoutStyle={{ fill: "white" }}
                constrainToVisibleArea
              />
            }
          />
        }
      >
        <VictoryAxis
          label={
            isHistoryFilterActive
              ? "היסטוריה"
              : format(selectedDate.toDate(), "MMMM yyyy", { locale: he })
          }
          style={{
            axisLabel: { padding: 30, fontSize: 12 },
            tickLabels: {
              fontSize: 10,
              padding: 5,
              angle: 0,
              textAnchor: "middle",
            },
          }}
          tickFormat={() => ""}
        />
        <VictoryAxis
          dependentAxis
          tickValues={[1, 2, 3, 4, 5]}
          tickFormat={(t) => t.toString()}
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryLine
          data={chartData}
          style={{
            data: { stroke: (chartConfig as any).color(1) },
          }}
        />
        <VictoryScatter
          data={chartData}
          size={4}
          style={{
            data: { fill: (chartConfig as any).color(1) },
          }}
        />
      </VictoryChart>
    </View>
  );
};

export default LineChartComponent;
