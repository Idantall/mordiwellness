import React, { useRef, useState, useCallback } from "react";
import {
  View,
  useWindowDimensions,
  Modal,
  Text,
  Pressable,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import { GoalDocument, CategoryDocument } from "types";
import Toast from "react-native-toast-message";
import AnimatedWindow from "../core/custom-window";
import Header from "../core/header";
import CustomPressable from "../core/custom-pressable";
import Icon from "react-native-vector-icons/Ionicons";

interface SubCircleProps {
  goals: GoalDocument[];
  onUpdateGoal: (updatedGoal: GoalDocument) => Promise<void>;
  category: CategoryDocument;
}

const getColor = (
  baseColor: string,
  grade: number,
  userGrade: number
): string => {
  if (grade > userGrade) return `${baseColor}20`;
  return baseColor;
};

const getBorderColor = (grade: number): string => {
  if (grade <= 1) return "red";
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
  const innerStart = polarToCartesian(center, center, innerRadius, endAngle);
  const outerStart = polarToCartesian(center, center, outerRadius, endAngle);
  const outerEnd = polarToCartesian(center, center, outerRadius, startAngle);
  const innerEnd = polarToCartesian(center, center, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

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
    largeArcFlag,
    0,
    outerEnd.x,
    outerEnd.y,
    "L",
    innerEnd.x,
    innerEnd.y,
    "A",
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    1,
    innerStart.x,
    innerStart.y,
    "Z",
  ].join(" ");
};

const createArcPath = (
  startAngle: number,
  endAngle: number,
  center: number,
  radius: number
): string => {
  const start = polarToCartesian(center, center, radius, startAngle);
  const end = polarToCartesian(center, center, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const SubCircle: React.FC<SubCircleProps> = ({
  goals,
  onUpdateGoal,
  category,
}) => {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width, height) * 0.8;
  const center = size / 2;
  const radius = (size / 2) * 0.8;
  const borderRadius = radius;
  const textRadius = radius * 1.1;
  const iconRadius = radius * 1.25;

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editGoalWindowVisible, setEditGoalWindowVisible] =
    useState<boolean>(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalDocument | null>(null);
  const [selectedGoalForEdit, setSelectedGoalForEdit] =
    useState<GoalDocument | null>(null);
  const [savingGoalEdit, setSavingGoalEdit] = useState<boolean>(false);
  const [sliderValue, setSliderValue] = useState<number>(1);
  const [editTasks, setEditTasks] = useState<string[]>([]);

  const playSuccessSound = () => {};

  const onGoodProgress = (previousGrade: number, currentGrade: number) => {
    if (currentGrade > previousGrade) {
      playSuccessSound();
    }
  };

  const debounce = (func: (...args: any) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  const handleGoalPress = useCallback(
    debounce(async (goal: GoalDocument, grade: number) => {
      const newGrade = grade + 1;
      if (newGrade > 5 || goal.grade === newGrade) return;
      const updatedGoal = { ...goal, grade: newGrade };
      await onUpdateGoal(updatedGoal);
      onGoodProgress(goal.grade, newGrade);
      Toast.show({
        text1: "מדהים!",
        text2: "המטרה שלך עודכנה בהצלחה",
        type: "success",
      });
    }, 100),
    [onUpdateGoal, onGoodProgress]
  );

  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handlePressIn = useCallback((goal: GoalDocument) => {
    isLongPress.current = false;
    longPressTimeout.current = setTimeout(() => {
      isLongPress.current = true;
      setSelectedGoal(goal);
      setSliderValue(goal.grade);
      setModalVisible(true);
    }, 500);
  }, []);

  const handlePressOut = useCallback(
    (goal: GoalDocument, grade: number) => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
      if (!isLongPress.current) {
        handleGoalPress(goal, grade);
      }
    },
    [handleGoalPress]
  );

  const handleGradeSubmit = async () => {
    if (selectedGoal) {
      if (selectedGoal.grade === sliderValue) return setModalVisible(false);
      const updatedGoal = { ...selectedGoal, grade: sliderValue };
      await onUpdateGoal(updatedGoal);
      setModalVisible(false);
      onGoodProgress(selectedGoal.grade, sliderValue);
      Toast.show({
        text1: "מדהים!",
        text2: "המטרה שלך עודכנה בהצלחה",
        type: "success",
      });
    }
  };

  const handleEditPress = (goal: GoalDocument) => {
    setSelectedGoalForEdit(goal);
    setEditTasks(
      goal.tasks
        ? goal.tasks.split("\n").filter((task) => task.trim() !== "")
        : []
    );
    setEditGoalWindowVisible(true);
  };

  const addTask = () => {
    setEditTasks([...editTasks, ""]);
  };

  const removeTask = (index: number) => {
    const newTasks = editTasks.filter((_, i) => i !== index);
    setEditTasks(newTasks);
  };

  const updateTask = (index: number, text: string) => {
    const newTasks = [...editTasks];
    newTasks[index] = text;
    setEditTasks(newTasks);
  };

  const handleEditGoal = async () => {
    if (selectedGoalForEdit) {
      setSavingGoalEdit(true);
      try {
        const tasksString = editTasks
          .filter((task) => task.trim() !== "")
          .join("\n");
        const updatedGoal = { ...selectedGoalForEdit, tasks: tasksString };
        await onUpdateGoal(updatedGoal);
        setEditGoalWindowVisible(false);
        Toast.show({
          text1: "מדהים!",
          text2: "המטרה שלך עודכנה בהצלחה",
          type: "success",
        });
      } catch (err) {
        console.error(err);
        Toast.show({
          text1: "לא טוב!",
          text2: "שגיאה בעת עדכון פרטיי המטרה שלך",
          type: "error",
        });
      } finally {
        setSavingGoalEdit(false);
      }
    }
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
          {goals.slice(0, 3).map((goal, goalIndex) => {
            const goalAngle = 360 / goals.length;
            const startAngle = goalIndex * goalAngle;
            const endAngle = (goalIndex + 1) * goalAngle;
            const midAngle = (startAngle + endAngle) / 2;
            const borderColor = getBorderColor(goal.grade);

            const textPosition = polarToCartesian(
              center,
              center,
              textRadius,
              midAngle
            );

            return (
              <G key={`${goal.id}-${goalIndex}`}>
                {[...Array(5)].map((_, index) => {
                  const gradeIndex = index + 1;
                  const innerRadius = (radius * index) / 5;
                  const outerRadius = (radius * (index + 1)) / 5;
                  const color = getColor("#1E88E5", gradeIndex, goal.grade);
                  return (
                    <Path
                      key={`${goal.id}-${index}`}
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
                      onPressIn={() => handlePressIn(goal)}
                      onPressOut={() => handlePressOut(goal, index)}
                    />
                  );
                })}

                <Path
                  d={createArcPath(startAngle, endAngle, center, borderRadius)}
                  stroke={borderColor}
                  strokeWidth="3"
                  fill="none"
                  pointerEvents="none"
                />

                <SVGText
                  x={textPosition.x}
                  y={textPosition.y}
                  fill="black"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}, ${textPosition.x}, ${textPosition.y})`}
                >
                  {goal.name}
                </SVGText>
              </G>
            );
          })}
        </Svg>
        {goals.slice(0, 3).map((goal, goalIndex) => {
          const goalAngle = 360 / goals.length;
          const midAngle = goalIndex * goalAngle + goalAngle / 2;
          const iconPosition = polarToCartesian(
            center,
            center,
            iconRadius,
            midAngle
          );

          return (
            <TouchableOpacity
              key={`edit-${goal.id}`}
              style={{
                position: "absolute",
                left: iconPosition.x - 12,
                top: iconPosition.y - 12,
                width: 24,
                height: 24,
                backgroundColor: "white",
                borderRadius: 12,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => handleEditPress(goal)}
            >
              <FontAwesomeIcon name="pencil" size={14} color="black" />
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedGoal && (
        <Modal visible={modalVisible} animationType="slide">
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-lg font-semibold mb-4">
              מה מצב ה{selectedGoal.name}?
            </Text>
            <Slider
              style={{ width: "80%", height: 40 }}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={sliderValue}
              onValueChange={setSliderValue}
              minimumTrackTintColor="blue" // Customize the color as needed
              maximumTrackTintColor="navy"
              thumbTintColor="blue"
            />
            <Text className="text-lg font-semibold mt-2">
              דירוג נוכחי: {sliderValue}
            </Text>
            <View className="flex-row mt-6">
              <Pressable
                className="bg-blue-700 p-3 rounded-full mx-2"
                onPress={handleGradeSubmit}
              >
                <Text className="text-white">אשר דירוג</Text>
              </Pressable>
              <Pressable
                className="bg-gray-500 p-3 rounded-full mx-2"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-white">בטל</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {selectedGoalForEdit && (
        <AnimatedWindow
          visible={editGoalWindowVisible}
          showCloseArrow={false}
          animationConfig={{
            slide: true,
            slideDirection: "right",
          }}
          onClose={() => setEditGoalWindowVisible(false)}
        >
          <View className="w-full flex-1">
            <Header label={category.name} showMenu={false} />
            <View className="w-full justify-center items-start p-4 gap-2 mt-24">
              <Text className="w-full text-right font-bold text-lg">
                תיאור המטרה:
              </Text>
              <TextInput
                className="w-full border rounded-md px-4 py-2"
                textAlign="right"
                textAlignVertical="top"
                multiline
                numberOfLines={4}
                value={selectedGoalForEdit.description}
                onChangeText={(description) =>
                  setSelectedGoalForEdit((prev) => ({
                    ...prev,
                    description,
                  }))
                }
              />
            </View>
            <ScrollView
              className="w-full min-h-[20px] max-h-[400px] p-4 gap-2"
              contentContainerStyle={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="w-full h-full"
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} // Add offset for iOS
              >
                <Text className="w-full text-right font-bold text-lg">
                  משימות:
                </Text>
                <FlatList
                  data={editTasks}
                  className="w-full"
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View className="flex-row items-center mb-4">
                      <Pressable
                        onPress={() => removeTask(index)}
                        className="p-2 bg-red-500 rounded-full mr-2"
                      >
                        <Icon name="remove" size={20} color="#fff" />
                      </Pressable>
                      <TextInput
                        value={item}
                        onChangeText={(text) => updateTask(index, text)}
                        className="flex-1 border border-gray-300 rounded-md p-2 mr-2 text-right"
                        placeholder="הזן משימה..."
                        placeholderTextColor="#999"
                      />
                      {index === editTasks.length - 1 && (
                        <Pressable
                          onPress={addTask}
                          className="p-2 bg-green-500 rounded-full"
                        >
                          <Icon name="add" size={20} color="#fff" />
                        </Pressable>
                      )}
                    </View>
                  )}
                  ListFooterComponent={
                    editTasks.length === 0 ? (
                      <Pressable
                        onPress={addTask}
                        className="p-2 bg-blue-500 rounded-md"
                      >
                        <Text className="text-white text-center">
                          הוסף משימה חדשה
                        </Text>
                      </Pressable>
                    ) : null
                  }
                />
              </KeyboardAvoidingView>
            </ScrollView>
            <View className="w-full px-4 py-2 relative sm:bottom-[-10%] md:bottom-[-20%] lg:bottom-[-40%]">
              <CustomPressable
                loading={savingGoalEdit}
                disabled={savingGoalEdit}
                title="שמור שינויים"
                onPress={handleEditGoal}
              />
            </View>
          </View>
        </AnimatedWindow>
      )}
    </View>
  );
};

export default SubCircle;
