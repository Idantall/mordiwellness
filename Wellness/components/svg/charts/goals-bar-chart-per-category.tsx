import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from "react-native";
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { ArchievedGrade } from '@/types';

interface GoalsGradeBarChartProps {
    archievedGrades: ArchievedGrade[],
    chartConfig: {},
    error: boolean,
    loading: boolean,
    width: number,
    height: number,
}

export default function GoalsGradeBarChart(props: GoalsGradeBarChartProps) {
    const { width, height, loading, error, archievedGrades } = props;

    const mappedAndFilteredGrades = useMemo(() => {
        return archievedGrades.filter(grade => grade.type === "goal").map(grade => {
            const gradedAt = (grade.gradedAt as any).toDate() as Date;
            const hour = `${gradedAt.getHours()}:${gradedAt.getMinutes().toString().length > 1 ? gradedAt.getMinutes() : `0${gradedAt.getMinutes()}`}`;
            return { ...grade, gradedAt, hour };
        }).filter(({ gradedAt }) => {
            const startOfDay = new Date(Date.now());
            const endOfDay = new Date(Date.now());
            startOfDay.setHours(0,0,0,0);
            endOfDay.setHours(23,59,59,59.99);
            return gradedAt >= startOfDay && gradedAt <= endOfDay;
        })
    }, [archievedGrades])

    const groupedAndAveragedGrades = Object.entries(mappedAndFilteredGrades.reduce((acc, curr) => {
        if (!acc[curr.name]) acc[curr.name] = [] as ArchievedGrade[];
        acc[curr.name].push(curr);
        return acc as Record<string, ArchievedGrade[]>;
    }, {})).map(([name, grades]: [string, ArchievedGrade[]]) => {
        return {
            name,
            grade: grades.reduce((acc, curr) => acc + curr.grade, 0) / grades.length
        }
    })

    if (loading) {
        return (
          <View style={{ width, height }} className="items-center justify-center">
            <ActivityIndicator color="blue" />
            <Text>טוען מידע אודות דירוגים...</Text>
          </View>
        );
    }

    if (error) {
        return (
          <View style={{ width, height }} className="items-center justify-center bg-white p-4 rounded-lg">
            <Text className="text-red-600">שגיאה בטעינת דירוגים. נסה שוב מאוחר יותר.</Text>
          </View>
        );
    }

    if (mappedAndFilteredGrades.length < 1) {
        return (
          <View
            style={{ width, height, borderRadius: 16 }}
            className="items-center justify-center bg-white"
          >
            <Text className="text-gray-400 text-lg">
              אין דירוגים כרגע לקטגוריה זו
            </Text>
          </View>
        );
    }

    return (
        <View style={{ width, height }} className="justify-center items-center">
            <VictoryChart
                theme={VictoryTheme.material}
                domainPadding={20}
                width={width}
                height={height}
            >
                <VictoryAxis
                    tickFormat={(t) => t}
                    style={{
                        tickLabels: { angle: 12, textAnchor: 'start', fontSize: 8 }
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    tickFormat={(t) => t}
                    domain={[0, 4]}
                />
                <VictoryBar
                    data={groupedAndAveragedGrades.map(({ name, grade }) => ({ x: name, y: grade }))}
                    style={{ data: { fill: mappedAndFilteredGrades[0].color } }}
                />
            </VictoryChart>
        </View>
    );
}
