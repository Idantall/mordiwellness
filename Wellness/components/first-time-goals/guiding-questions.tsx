import {
  CategoryDocument,
  InteractiveQuestion,
  ThinkingQuestion,
} from "@/types";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Platform,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import Header from "components/core/header";

interface GuidingQuestionsWindowProps {
  selectedCategory: CategoryDocument;
  handleUpdateCategory: (updatedCategory: CategoryDocument) => Promise<void>;
  handleCloseAndOpen: () => void;
  handleClose: () => void;
}

export default function GuidingQuestionsWindow(
  props: GuidingQuestionsWindowProps
) {
  const { selectedCategory } = props;
  const { width, height } = useWindowDimensions();

  const [ThinkingQuestions, setThinkingQuestions] = useState<
    ThinkingQuestion[]
  >([
    { text: `מה ברצונך להשיג בקטגוריה ${selectedCategory.name}?` },
    {
      text: `כיצד אתה מתכוון להשיג את המטרה שלך בקטגוריה ${selectedCategory.name}?`,
    },
    {
      text: `מה יצטרך לקרות על מנת שתוכל להשיג את המטרה שלך בקטגוריה ${selectedCategory.name}?`,
    },
  ]);

  const [currentThinkingQuestionIndex, setCurrentThinkingQuestionIndex] =
    useState<number>(0);
  const [interactiveQuestion, setInteractiveQuestion] =
    useState<InteractiveQuestion>({
      text: `כמה קשה אתה מוכן לעבוד על מנת להשיג את המטרה שלך בקטגוריה ${selectedCategory.name}?`,
      grade: 0,
    });
  const [activeWindow, setActiveWindow] = useState<number>(0);

  const onNext = () => {
    setActiveWindow((prev) => ++prev);
  };

  const IntroductionComponent = () => {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full h-full flex-1 justify-between bg-white p-8">
          <View className="flex-1 justify-start items-center mt-10">
            <Icon
              name="information-circle-outline"
              size={50}
              color={selectedCategory.color}
              className="mb-4"
            />
            <Text className="text-3xl font-bold mb-6 text-center">רק רגע!</Text>
            <Text className="text-lg text-center mb-4">
              לפניי שנתחיל בשיפור הקטגוריה
            </Text>
            <Text className="text-lg text-center mb-4">
              נציג בפנייך מספר שאלות מכוונות, חלקן שאלות חשיבה וחלקן שאלות
              שתצטרך לדרג מ1-5
            </Text>
            <Text className="text-lg text-center mb-4">
              יש להקדיש לשאלות הללו חשיבה כיוון שהן חלק מתהליך השיפור העצמי שלך
            </Text>
          </View>
          <Pressable
            className="bg-blue-700 w-full px-4 py-2 rounded-md flex-row items-center justify-center mb-10"
            onPress={onNext}
          >
            <Icon name="arrow-back" size={20} color="#FFF" className="mr-2" />
            <Text className="text-white font-bold text-center">התחל</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  const ThinkingQuestionsComponent = ({
    question,
  }: {
    question: ThinkingQuestion;
  }) => {
    const handleSkip = () => {
      onNext();
    };

    const handleNextQuestion = () => {
      if (currentThinkingQuestionIndex === ThinkingQuestions.length - 1) {
        return onNext();
      }
      setCurrentThinkingQuestionIndex((prev) => ++prev);
    };

    const containerStyle = width > 600 ? "w-3/4" : "w-full";

    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          className={`w-full h-full flex-1 justify-between p-8 ${containerStyle}`}
        >
          <View className="flex-1 justify-start items-center mt-10">
            <Icon
              name="information-circle-outline"
              size={50}
              color="#000"
              className="mb-4"
            />
            <Text className="text-3xl font-bold mb-6 text-center">
              שאלת חשיבה
            </Text>
            <Text className="text-lg text-center mb-4">{question.text}</Text>
            <TextInput
              className="w-full h-40 p-4 border border-gray-300 rounded-md"
              multiline
              numberOfLines={4}
              textAlign="right"
              textAlignVertical="top"
              placeholder="כתוב את התשובה שלך כאן..."
              style={{ marginBottom: 200 }}
            />
          </View>
          <View className="flex flex-row justify-center items-center gap-x-6 sm:mb-4 md:mb-6 lg:mb-8">
            <Pressable
              className="bg-blue-700 w-2/3 px-4 py-2 rounded-md flex-row items-center justify-center mb-10"
              onPress={handleNextQuestion}
            >
              <Icon name="arrow-back" size={20} color="#FFF" className="mr-2" />
              <Text className="text-white font-bold text-center">הבא</Text>
            </Pressable>
            <Pressable
              className="bg-gray-600 w-1/3 px-4 py-2 rounded-md flex-row items-center justify-center mb-10"
              onPress={handleSkip}
            >
              <Icon name="arrow-back" size={20} color="#FFF" className="mr-2" />
              <Text className="text-white font-bold text-center">דלג</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  };

  const InteractiveQuestionsComponent = ({
    question,
  }: {
    question: InteractiveQuestion;
  }) => {
    const [sliderValue, setSliderValue] = useState<number>(0);

    const handleNext = () => {
      setInteractiveQuestion((prev) => ({ ...prev, grade: sliderValue }));
      onNext();
    };

    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full h-full flex-1 justify-between p-8">
          <View className="flex-1 justify-start items-center mt-10">
            <Icon
              name="information-circle-outline"
              size={50}
              color="#000"
              className="mb-4"
            />
            <Text className="text-3xl font-bold mb-6 text-center">
              שאלה אינטרקטיבית
            </Text>
            <Text className="text-md text-center mb-4">{question.text}</Text>
            <Slider
              style={{ width: "80%", height: 40 }}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={sliderValue}
              onValueChange={setSliderValue}
              minimumTrackTintColor="blue"
              maximumTrackTintColor="navy"
              thumbTintColor="blue"
            />
            <Text className="text-md text-center mb-4">
              דירוג נוכחי: {sliderValue}
            </Text>
          </View>
          <Pressable
            className="bg-blue-700 w-full px-4 py-2 rounded-md flex-row items-center justify-center mb-10"
            onPress={handleNext}
          >
            <Icon name="arrow-back" size={20} color="#FFF" className="mr-2" />
            <Text className="text-white font-bold text-center">הבא</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  const ConclusionComponent = () => {
    const handleContinue = () => {
      props.handleUpdateCategory({
        ...props.selectedCategory,
        active: true,
      });
      props.handleCloseAndOpen();
    };

    if (interactiveQuestion.grade < 4) {
      return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="w-full h-full flex-1 justify-between p-8">
            <View className="flex-1 justify-start items-center mt-10">
              <Icon
                name="information-circle-outline"
                size={50}
                color="#000"
                className="mb-4"
              />
              <Text className="text-3xl font-bold mb-6 text-center">
                איזה באסה
              </Text>
              <Text className="text-lg text-center mb-4">
                נראה שיש לך מוטיבציה נמוכה לעבוד על קטגוריה זו. ללא מוטיבציה לא
                תצליח להשתפר. האם תרצה לבחור קטגוריה אחרת?
              </Text>
            </View>
            <View className="flex flex-row justify-center items-center gap-x-6">
              <Pressable
                className="bg-blue-700 w-1/2 px-4 py-2 rounded-md flex-row items-center justify-center mb-10"
                onPress={props.handleClose}
              >
                <Icon
                  name="arrow-back"
                  size={20}
                  color="#FFF"
                  className="mr-2"
                />
                <Text className="text-white font-bold text-center">
                  בחר קטגוריה אחרת
                </Text>
              </Pressable>
              <Pressable
                className="bg-gray-700 w-1/3 px-4 py-2 rounded-md flex-row items-center justify-center mb-10"
                onPress={handleContinue}
              >
                <Icon
                  name="arrow-back"
                  size={20}
                  color="#FFF"
                  className="mr-2"
                />
                <Text className="text-white font-bold text-center">
                  המשך בכל זאת
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full h-full flex-1 justify-between p-8">
          <View className="flex-1 justify-start items-center mt-10">
            <Icon name="trophy-sharp" size={50} color="#000" className="mb-4" />
            <Text className="text-3xl font-bold mb-6 text-center">
              איזה כיף
            </Text>
            <Text className="text-lg text-center mb-4">
              זה נראה שאתה מלא ברצון לשפר את המטרה שלך!
            </Text>
            <Text className="text-lg text-center mb-4">לחץ על מנת להמשיך</Text>
          </View>
          <View className="flex flex-row justify-center items-center gap-x-6">
            <Pressable
              className="bg-blue-700 w-full px-4 py-2 rounded-md flex-row items-center justify-center mb-10"
              onPress={handleContinue}
            >
              <Icon name="arrow-back" size={20} color="#FFF" className="mr-2" />
              <Text className="text-white font-bold text-center">
                המשך בכל הכוח!
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View className="flex-1 w-full">
      <Header
        label={selectedCategory.name}
        showBorder={false}
        showLogo={false}
        showMenu={false}
      />
      {activeWindow === 0 && <IntroductionComponent />}
      {activeWindow === 1 && (
        <ThinkingQuestionsComponent
          question={ThinkingQuestions[currentThinkingQuestionIndex]}
        />
      )}
      {activeWindow === 2 && (
        <InteractiveQuestionsComponent question={interactiveQuestion} />
      )}
      {activeWindow === 3 && <ConclusionComponent />}
    </View>
  );
}
