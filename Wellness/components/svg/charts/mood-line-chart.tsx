import React, { useMemo } from "react";
import dayjs from "dayjs";

import { View, Dimensions } from "react-native";
import { Image as SvgImage } from "react-native-svg";
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryTheme,
  VictoryScatter,
} from "victory-native";
import { MoodEmoji, MoodEntry, TimePeriod } from "@/types";
import { getDateDJ, getNowDJ } from "@/utils/dates";

const screenWidth = Dimensions.get("window").width;

const hebrewDayNames = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת",
];
const hebrewMonthNames = [
  "ינו",
  "פבר",
  "מרץ",
  "אפר",
  "מאי",
  "יונ",
  "יול",
  "אוג",
  "ספט",
  "אוק",
  "נוב",
  "דצמ",
];

const colorToHebrew: { [key: string]: string } = {
  darkgreen: "ירוק כהה",
  lightgreen: "ירוק בהיר",
  yellow: "צהוב",
  orange: "כתום",
  red: "אדום",
};

const colorToValue: { [key: string]: number } = {
  darkgreen: 5,
  lightgreen: 4,
  yellow: 3,
  orange: 2,
  red: 1,
  invalid: 0,
};

function indicationToColor(indication: number) {
  if (indication > 60) return "red";
  if (indication > 40) return "orange";
  if (indication > 20) return "yellow";
  if (indication > 10) return "lightgreen";
  if (indication > 0) return "darkgreen";
  return "invalid";
}

interface MoodLineChartProps {
  moodHistory: MoodEntry[];
  initialMockEmojis: MoodEmoji[];
  selectedFilter: TimePeriod;
  loading: boolean;
  error: boolean;
  isRefetching: boolean;
  onRefetch: () => void;
}

const MoodLineChart: React.FC<MoodLineChartProps> = ({
  moodHistory,
  initialMockEmojis,
  selectedFilter,
  loading,
  error,
}) => {
  const groupedAndAveragedMoods = useMemo(() => {
    if (!moodHistory || !selectedFilter) return [];

    const getMoodValue = (moodIndication: number) => {
      const color = indicationToColor(moodIndication);
      return colorToValue[color] ?? 0;
    };

    switch (selectedFilter) {
      case "day": {
        const startOfToday = getNowDJ().startOf("day");
        const endOfToday = getNowDJ().endOf("day");

        const res = moodHistory
          .filter((mood) => {
            const moodDate = getDateDJ(mood.chosenAt);
            return (
              startOfToday.isSameOrBefore(moodDate, "milliseconds") &&
              moodDate.isSameOrBefore(endOfToday, "milliseconds")
            );
          })
          .map((mood) => ({
            key: getDateDJ(mood.chosenAt).format("HH:mm:ss"),
            mood: getMoodValue(mood.emoji.moodIndication),
          }));

        return res;
      }

      case "week": {
        const startOfThisWeek = getNowDJ().startOf("week");
        const endOfThisWeek = getNowDJ().endOf("week");

        return moodHistory
          .filter((mood) => {
            const moodDate = getDateDJ(mood.chosenAt);
            return (
              startOfThisWeek.isSameOrBefore(moodDate, "milliseconds") &&
              moodDate.isSameOrBefore(endOfThisWeek, "milliseconds")
            );
          })
          .map((mood) => ({
            key: hebrewDayNames[getDateDJ(mood.chosenAt).day()],
            mood: getMoodValue(mood.emoji.moodIndication),
          }));
      }

      case "month": {
        const startOfThisMonth = getNowDJ().startOf("month");
        const today = getNowDJ().endOf("day");

        return moodHistory
          .filter((mood) => {
            const moodDate = getDateDJ(mood.chosenAt);
            return (
              startOfThisMonth.isSameOrBefore(moodDate, "milliseconds") &&
              moodDate.isSameOrBefore(today)
            );
          })
          .map((mood) => ({
            key: getDateDJ(mood.chosenAt).format("dd/MM"),
            mood: getMoodValue(mood.emoji.moodIndication),
          }));
      }

      case "year": {
        const startOfThisYear = getNowDJ().startOf("year");
        const today = getNowDJ().endOf("day");

        return moodHistory
          .filter((mood) => {
            const moodDate = getDateDJ(mood.chosenAt);
            return (
              startOfThisYear.isSameOrBefore(moodDate, "milliseconds") &&
              moodDate.isSameOrBefore(today)
            );
          })
          .map((mood) => ({
            key: hebrewDayNames[getDateDJ(mood.chosenAt).month()],
            mood: getMoodValue(mood.emoji.moodIndication),
          }));
      }

      case "1_month_ago":
      case "2_months_ago":
      case "3_months_ago": {
        let monthOffset = 3;
        if (selectedFilter === "1_month_ago") monthOffset = 1;
        if (selectedFilter === "2_months_ago") monthOffset = 2;

        // const startOfTargetMonth = addMonths(startOfMonth(today), -monthOffset);
        const startOfTargetMonth = getNowDJ()
          .subtract(monthOffset, "month")
          .startOf("month");
        const endOfTargetMonth = getDateDJ(startOfTargetMonth).endOf("month");

        return moodHistory
          .filter((mood) => {
            const moodDate = getDateDJ(mood.chosenAt);
            return (
              startOfTargetMonth.isSameOrBefore(moodDate, "milliseconds") &&
              moodDate.isSameOrBefore(endOfTargetMonth, "milliseconds")
            );
          })
          .map((mood) => ({
            key: getDateDJ(mood.chosenAt).format("dd/MM"),
            mood: getMoodValue(mood.emoji.moodIndication),
          }));
      }

      case "ever": {
        return moodHistory.map((mood) => {
          const moodValue = getMoodValue(mood.emoji.moodIndication);
          const moodDate = getDateDJ(mood.chosenAt);
          return {
            key: `${hebrewMonthNames[moodDate.month()]} ${moodDate.format("yyyy")}`,
            mood: moodValue,
          };
        });
      }

      default:
        return [];
    }
  }, [moodHistory, selectedFilter]);

  const chartData = useMemo(() => {
    return groupedAndAveragedMoods.map((item, index) => ({
      x: index,
      y: item.mood ?? 0,
    }));
  }, [groupedAndAveragedMoods]);

  const colorToImageMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    if (moodHistory) {
      moodHistory.forEach((entry) => {
        const color = indicationToColor(entry.emoji.moodIndication);
        if (!map[color]) {
          map[color] = entry.emoji.image;
        }
      });
    }
    return map;
  }, [moodHistory]);

  const CustomTickLabel = useMemo(() => {
    return (props: any) => {
      const { x, y, text } = props;

      const index = Number(text) - 1;

      const emoji = initialMockEmojis.toReversed()[index];

      if (!emoji) return null;

      return (
        <SvgImage
          x={x - 24}
          y={y - 14}
          width={20}
          height={20}
          href={{ uri: emoji.image }}
        />
      );
    };
  }, [colorToImageMap]);

  if (loading || error) return null;

  return (
    <View style={{ width: screenWidth - 40, height: 220 }}>
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={{ x: 20, y: 20 }}
        width={screenWidth - 40}
        height={220}
      >
        <VictoryAxis
          tickFormat={(t) =>
            chartData[t] ? groupedAndAveragedMoods[t].key : ""
          }
          style={{
            tickLabels: { angle: -45, fontSize: 8, padding: 15 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickValues={[1, 2, 3, 4, 5]}
          tickLabelComponent={<CustomTickLabel />}
          style={{
            tickLabels: {
              fontSize: 10,
              fontWeight: "bold",
              padding: 5,
              fill: ({ tick }) => {
                const colorKey = Object.keys(colorToValue).find(
                  (key) => colorToValue[key] === tick
                );
                return colorKey || "black";
              },
            },
          }}
        />
        <VictoryLine
          data={chartData}
          style={{
            data: { stroke: "#4287f5" },
          }}
        />
        <VictoryScatter
          data={chartData}
          size={4}
          style={{
            data: { fill: "#4287f5" },
          }}
        />
      </VictoryChart>
    </View>
  );
};

export default MoodLineChart;
