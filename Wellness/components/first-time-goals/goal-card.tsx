import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import Slider from "@react-native-community/slider";
import Icon from "react-native-vector-icons/Ionicons";
import { GoalDocument } from "types";
import CustomPressable from "components/core/custom-pressable";

export const GoalComponent = ({
  goal,
  onGradeChange,
  onTaskChange,
  onToggleActive,
}: {
  goal: GoalDocument;
  onGradeChange: (id: string, grade: number) => void;
  onTaskChange: (id: string, tasks: string) => void;
  onToggleActive: (id: string) => void;
}) => {
  const [gradeModalVisible, setGradeModalVisible] = useState<boolean>(false);
  const [taskModalVisible, setTaskModalVisible] = useState<boolean>(false);
  const [currentGrade, setCurrentGrade] = useState<number>(
    goal.grade > 5 ? 5 : goal.grade
  );
  const [tasks, setTasks] = useState<string[]>(
    goal.tasks
      ? goal.tasks.split("\n").filter((task) => task.trim() !== "")
      : []
  );

  const addTask = () => {
    setTasks([...tasks, ""]);
  };

  const removeTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
  };

  const updateTask = (index: number, text: string) => {
    const newTasks = [...tasks];
    newTasks[index] = text;
    setTasks(newTasks);
  };

  return (
    <View className="p-6 mb-6 rounded-lg shadow-lg bg-white border-l-8 border-blue-500 w-full">
      <View className="flex-row-reverse justify-between items-center mb-4">
        <Text className="text-xl font-bold">{goal.name}</Text>
        <Pressable
          onPress={() => onToggleActive(goal.id)}
          className={`p-2 rounded-full ${goal.active ? "bg-green-500" : "bg-gray-300"}`}
        >
          <Icon
            name={goal.active ? "checkmark" : "add"}
            size={24}
            color="#fff"
          />
        </Pressable>
      </View>

      <View className="flex-row-reverse justify-between gap-x-6 mb-4">
        <Pressable
          onPress={() => setGradeModalVisible(true)}
          className="flex-1 mx-1"
        >
          <View className="flex-row-reverse items-center justify-center p-3 bg-blue-500 rounded-md shadow-sm">
            <Icon name="star-outline" size={20} color="#fff" />
            <Text className="text-white mr-2">דרג מצבך</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setTaskModalVisible(true)}
          className="flex-1 mx-1"
        >
          <View className="flex-row-reverse items-center justify-center p-3 bg-green-500 rounded-md shadow-sm">
            <Icon name="create-outline" size={20} color="#fff" />
            <Text className="text-white mr-2">כתוב משימות</Text>
          </View>
        </Pressable>
      </View>

      <View className="flex-row-reverse justify-between items-center">
        <Text className="text-gray-600">דירוג נוכחי:</Text>
        <View className="flex-row items-center">
          <Text className="text-lg font-semibold mr-2">
            {goal.grade > 5 ? 5 : goal.grade}
          </Text>
          <Icon name="star" size={20} color="#FFD700" />
        </View>
      </View>
      {/* Grade Modal */}
      <Modal
        visible={gradeModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-white">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="w-11/12 bg-white rounded-3xl shadow-2xl"
          >
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row-reverse justify-between items-center gap-x-6">
                <Pressable
                  onPress={() => setGradeModalVisible(false)}
                  className="p-2"
                >
                  <Icon name="close-outline" size={24} color="#000" />
                </Pressable>
                <Text className="text-lg font-semibold">
                  דירוג {goal.name} בחייך?
                </Text>
              </View>
            </View>
            <View className="p-4">
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={currentGrade}
                onValueChange={setCurrentGrade}
                minimumTrackTintColor="#4299E1"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#4299E1"
              />
              <Text className="text-lg font-semibold mb-4 text-center">
                דירוג נוכחי: {currentGrade}
              </Text>
              <CustomPressable
                title="שמור"
                onPress={() => {
                  onGradeChange(goal.id, currentGrade);
                  setGradeModalVisible(false);
                }}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Task Modal */}
      <Modal visible={taskModalVisible} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center bg-white">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="w-11/12 bg-white rounded-3xl shadow-2xl"
          >
            <View className="p-2 border-b border-gray-200">
              <View className="flex-row-reverse justify-between items-center gap-6">
                <Pressable
                  onPress={() => setTaskModalVisible(false)}
                  className="pl-2 pt-2 pb-2"
                >
                  <Icon name="close-outline" size={24} color="#000" />
                </Pressable>
                <Pressable
                  onPress={addTask}
                  className="p-2 bg-blue-500 rounded-md"
                >
                  <Text className="text-white text-center">הוסף</Text>
                </Pressable>
              </View>
              <View className="px-4 py-2 items-center">
                <Text className="text-lg font-semibold">
                  משימות ל{goal.name}
                </Text>
              </View>
            </View>
            <View className="max-h-[250px]">
              <FlatList
                data={tasks}
                keyExtractor={(_, index) => index.toString()}
                className="h-full p-4"
                contentContainerStyle={{ flexGrow: 1 }}
                ListEmptyComponent={
                  <View className=" grow flex-row justify-center items-center mb-4">
                    <Text className="text-center">עדיין אין משימות</Text>
                  </View>
                }
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
                      multiline
                      onChangeText={(text) => updateTask(index, text)}
                      className="flex-1 border border-gray-300 rounded-md p-2 mr-2 text-right"
                      placeholder="הזן משימה..."
                      placeholderTextColor="#999"
                    />
                    {index === tasks.length - 1 && (
                      <Pressable
                        onPress={addTask}
                        className="p-2 bg-green-500 rounded-full"
                      >
                        <Icon name="add" size={20} color="#fff" />
                      </Pressable>
                    )}
                  </View>
                )}
                scrollEnabled
              />
            </View>
            <View className="p-4 w-min-[150px] w-2/3 self-center">
              <CustomPressable
                title="שמור"
                onPress={() => {
                  const tasksString = tasks
                    .filter((task) => task.trim() !== "")
                    .join("\n");
                  onTaskChange(goal.id, tasksString);
                  setTaskModalVisible(false);
                }}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};
