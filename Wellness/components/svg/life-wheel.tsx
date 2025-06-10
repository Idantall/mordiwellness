import React, { useRef, useState } from "react";
import {
    View,
    Modal,
    Text,
    Pressable,
} from "react-native";
import Svg, {
    G,
    Path,
    Circle,
    Defs,
    LinearGradient,
    Stop,
    Text as SVGText,
} from "react-native-svg";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome6";
import Slider from "@react-native-community/slider";
import { CategoryDocument } from "types";
import Toast from "react-native-toast-message";

interface LifeWheelProps {
    categories: CategoryDocument[];
    onUpdateCategory: (updatedCategory: CategoryDocument) => Promise<void>;
    size: number;
}

const getColor = (
    baseColor: string,
    grade: number,
    userGrade: number
): string => {
    if (grade <= userGrade) return baseColor;
    return `${baseColor}30`;
};

const getBorderColor = (grade: number): string => {
    if (grade <= 2) return "red";
    if (grade <= 3) return "orange";
    return "green";
};

const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
): { x: number; y: number } => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const createSlicePath = (
    center: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
): string => {
    const innerStart = polarToCartesian(
        center,
        center,
        innerRadius,
        startAngle
    );
    const outerStart = polarToCartesian(
        center,
        center,
        outerRadius,
        startAngle
    );
    const outerEnd = polarToCartesian(center, center, outerRadius, endAngle);
    const innerEnd = polarToCartesian(center, center, innerRadius, endAngle);
    return [
        "M",
        innerStart.x,
        innerStart.y,
        "L",
        outerStart.x,
        outerStart.y,
        "A",
        outerRadius,
        outerRadius,
        0,
        0,
        1,
        outerEnd.x,
        outerEnd.y,
        "L",
        innerEnd.x,
        innerEnd.y,
        "A",
        innerRadius,
        innerRadius,
        0,
        0,
        0,
        innerStart.x,
        innerStart.y,
        "Z",
    ].join(" ");
};

const LifeWheel: React.FC<LifeWheelProps> = ({
    categories,
    onUpdateCategory,
    size,
}) => {
    const center = size / 2;
    const radius = (size / 2) * 0.8;
    const labelRadius = radius * 1.1; // Slightly reduced
    const iconRadius = radius * 1.25; // Slightly reduced

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] =
        useState<CategoryDocument | null>(null);
    const [sliderValue, setSliderValue] = useState(5);

    // handle press
    const debounce = (func: (...args: any) => void, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    const handleCategoryPress = debounce(
        async (category: CategoryDocument, grade: number) => {
            if (category.grade === grade) return;
            const updatedCategory = { ...category, grade };
            await onUpdateCategory(updatedCategory);
            Toast.show({
                text1: "הצלחה",
                text2: "הקטגוריה שלך דורגה מחדש!",
                type: "success",
            });
        },
        100
    );

    const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);

    const handlePressIn = (category: CategoryDocument) => {
        isLongPress.current = false; // Reset the flag on press in
        longPressTimeout.current = setTimeout(() => {
            isLongPress.current = true; // Set the flag if long press is triggered
            setSelectedCategory(category);
            setSliderValue(category.grade);
            setModalVisible(true);
        }, 500);
    };

    const handlePressOut = (category: CategoryDocument, grade: number) => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
        }
        if (!isLongPress.current) {
            // Only handle short press if long press wasn't triggered
            handleCategoryPress(category, grade);
        }
    };

    const handleGradeSubmit = async () => {
        if (selectedCategory) {
            if (selectedCategory.grade === sliderValue)
                return setModalVisible(false);
            const updatedCategory = { ...selectedCategory, grade: sliderValue };
            await onUpdateCategory(updatedCategory);
            setModalVisible(false);
            Toast.show({
                text1: "הצלחה",
                text2: "הקטגוריה שלך דורגה מחדש!",
                type: "success",
            });
        }
    };

    const createArcPath = (startAngle: number, endAngle: number): string => {
        const start = polarToCartesian(center, center, radius, startAngle);
        const end = polarToCartesian(center, center, radius, endAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
    };

    return (
        <View className="items-center justify-center p-4">
            <View style={{ width: size, height: size, position: "relative" }}>
                <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
                    <Defs>
                        <LinearGradient
                            id="innerGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <Stop
                                offset="0%"
                                stopColor="#f0f0f0"
                                stopOpacity="1"
                            />
                            <Stop
                                offset="100%"
                                stopColor="#e0e0e0"
                                stopOpacity="1"
                            />
                        </LinearGradient>
                    </Defs>
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="url(#innerGradient)"
                        stroke="none"
                    />
                    {categories.map((category, categoryIndex) => {
                        const categoryAngle = 360 / categories.length;
                        const startAngle = categoryIndex * categoryAngle;
                        const endAngle = (categoryIndex + 1) * categoryAngle;
                        const midAngle = (startAngle + endAngle) / 2;
                        const labelPosition = polarToCartesian(
                            center,
                            center,
                            labelRadius,
                            midAngle
                        );
                        const iconPosition = polarToCartesian(
                            center,
                            center,
                            iconRadius,
                            midAngle
                        );
                        const borderColor = getBorderColor(category.grade);

                        return (
                            <G key={`${category.index}-${categoryIndex}`}>
                                {[...Array(5)].map((_, gradeIndex) => {
                                    const innerRadius =
                                        (radius * gradeIndex) / 5;
                                    const outerRadius =
                                        (radius * (gradeIndex + 1)) / 5;
                                    const color = getColor(
                                        category.color,
                                        gradeIndex + 1,
                                        category.grade
                                    );

                                    return (
                                        <G
                                            key={`${category.index}-${gradeIndex}`}
                                            onPressIn={() =>
                                                handlePressIn(category)
                                            }
                                            onPressOut={() =>
                                                handlePressOut(
                                                    category,
                                                    gradeIndex + 1
                                                )
                                            }
                                            hitSlop={{
                                                top: size,
                                                bottom: size,
                                                left: size,
                                                right: size,
                                            }}
                                        >
                                            <Path
                                                d={createSlicePath(
                                                    center,
                                                    innerRadius,
                                                    outerRadius,
                                                    startAngle,
                                                    endAngle
                                                )}
                                                fill={color}
                                                stroke="white"
                                                strokeWidth="0.5"
                                            />
                                        </G>
                                    );
                                })}
                                <Path
                                    d={createArcPath(startAngle, endAngle)}
                                    stroke={borderColor}
                                    strokeWidth="3"
                                    fill="none"
                                    pointerEvents="none"
                                />
                                <SVGText
                                    x={labelPosition.x}
                                    y={labelPosition.y}
                                    fill="black"
                                    fontSize="10" // Reduced from 12
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    transform={`rotate(${midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}, ${labelPosition.x}, ${labelPosition.y})`}
                                >
                                    {category.name}
                                </SVGText>
                                <FontAwesomeIcon
                                    name={category.icon}
                                    size={16} // Reduced from 20
                                    color="black"
                                    style={{
                                        position: "absolute",
                                        left: iconPosition.x - 8, // Adjusted for new size
                                        top: iconPosition.y - 8, // Adjusted for new size
                                        zIndex: 20,

                                    }}
                                />
                            </G>
                        );
                    })}
                </Svg>
            </View>

            {selectedCategory && (
                <Modal visible={modalVisible} animationType="slide">
                    <View className="flex-1 justify-center items-center p-4">
                        <Text className="text-lg font-semibold mb-4">
                            מה מצב ה{selectedCategory.name} בחייך?
                        </Text>
                        <Slider
                            style={{ width: 300, height: 40 }}
                            minimumValue={1}
                            maximumValue={5}
                            step={1}
                            value={sliderValue}
                            onValueChange={setSliderValue}
                        />
                        <Text className="text-lg font-semibold mb-4">
                            דירוג נוכחי: {sliderValue}
                        </Text>
                        <Pressable
                            className="bg-blue-700 rounded-md px-6 py-4"
                            onPress={handleGradeSubmit}
                        >
                            <Text className="text-white text-center font-bold">
                                אשר דירוג
                            </Text>
                        </Pressable>
                    </View>
                </Modal>
            )}
        </View>
    );
};

export default LifeWheel;
