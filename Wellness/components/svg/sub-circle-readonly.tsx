import { GoalDocument } from '@/types';
import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Circle, Defs, LinearGradient, Stop, Text as SVGText } from 'react-native-svg';

const getColor = (baseColor: string, grade: number, userGrade: number): string => {
  if (grade > userGrade) return `${baseColor}20`;
  return baseColor;
};

const getBorderColor = (grade: number): string => {
  if (grade <= 1) return 'red';
  if (grade <= 3) return 'orange';
  return 'green';
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number): { x: number; y: number } => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const createSlicePath = (centerX: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string => {
  const innerStart = polarToCartesian(centerX, centerX, innerRadius, startAngle);
  const outerStart = polarToCartesian(centerX, centerX, outerRadius, startAngle);
  const outerEnd = polarToCartesian(centerX, centerX, outerRadius, endAngle);
  const innerEnd = polarToCartesian(centerX, centerX, innerRadius, endAngle);

  return [
    'M', innerStart.x, innerStart.y,
    'L', outerStart.x, outerStart.y,
    'A', outerRadius, outerRadius, 0, 0, 1, outerEnd.x, outerEnd.y,
    'L', innerEnd.x, innerEnd.y,
    'A', innerRadius, innerRadius, 0, 0, 0, innerStart.x, innerStart.y,
    'Z',
  ].join(' ');
};

const createArcPath = (startAngle: number, endAngle: number, center: number, radius: number): string => {
  const start = polarToCartesian(center, center, radius, startAngle);
  const end = polarToCartesian(center, center, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
  ].join(' ');
};

interface SubCircleReadonlyProps {
  goals: GoalDocument[];
  size: number;
  hideGoalNames?: boolean; // New prop
}

const SubCircleReadonly: React.FC<SubCircleReadonlyProps> = ({ goals, size, hideGoalNames = false }) => {
  const center = size / 2;
  const radius = size / 2 * 0.8;
  const borderRadius = radius;
  const textRadius = radius * 0.7;

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        height={size}
        width={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <Defs>
          <LinearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#f0f0f0" stopOpacity="1" />
            <Stop offset="100%" stopColor="#e0e0e0" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="url(#innerGradient)"
        />
        {goals.length > 0 ? (
          goals.map((goal, goalIndex) => {
            const goalAngle = 360 / goals.length;
            const startAngle = goalIndex * goalAngle;
            const endAngle = (goalIndex + 1) * goalAngle;
            const midAngle = (startAngle + endAngle) / 2;
            const borderColor = getBorderColor(goal.grade);

            const textPosition = polarToCartesian(center, center, textRadius, midAngle);

            return (
              <G key={`${goal.id}-${goalIndex}`}>
                {[...Array(5)].map((_, gradeIndex) => {
                  const innerRadius = (radius * gradeIndex) / 5;
                  const outerRadius = (radius * (gradeIndex + 1)) / 5;
                  const color = getColor('#1E88E5', gradeIndex + 1, goal.grade);

                  return (
                    <Path
                      key={`${goal.id}-${gradeIndex}`}
                      d={createSlicePath(center, innerRadius, outerRadius, startAngle, endAngle)}
                      fill={color}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  );
                })}

                <Path
                  d={createArcPath(startAngle, endAngle, center, borderRadius)}
                  stroke={borderColor}
                  strokeWidth="3"
                  fill="none"
                />

                {!hideGoalNames && (
                  <SVGText
                    x={textPosition.x}
                    y={textPosition.y}
                    fill="black"
                    fontSize={size * 0.05}
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}, ${textPosition.x}, ${textPosition.y})`}
                  >
                    {goal.name}
                  </SVGText>
                )}
              </G>
            );
          })
        ) : (
          <SVGText
            x={center}
            y={center}
            fill="black"
            fontSize={size * 0.12}
            fontWeight="normal"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            התחל
          </SVGText>
        )}
      </Svg>
    </View>
  );
};

export default SubCircleReadonly;
