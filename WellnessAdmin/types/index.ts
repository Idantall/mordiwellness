export interface Account {
  id: string;
  displayName: string;
  phoneNumber: string;
  age: number;
  city: string;
  gender: "male" | "female";
  agreedToTermsAndConditions: boolean;
  profilePictureUrl: string;
  createdAt: Date;
  updatedAt: Date;
  new?: boolean;
  goals: GoalDocument[];
  categories: CategoryDocument[];
  currentMood: MoodEmoji;
  disabled?: boolean;
  fcmToken?: string;
}

export interface AccountLoginCredentionals {
  phoneNumber: string;
}

export interface AccountRegisterCredentionals {
  profilePictureUrl: string;
  displayName: string;
  phoneNumber: string;
  city: string;
  age: number;
  gender: "male" | "female";
  agreedToTermsAndConditions: boolean;
}

export interface CategoryDocument {
  name: string;
  icon: string;
  color: string;
  sound: string;
  grade: number;
  index: string;
  id: string;
  active: boolean;
}

export interface GoalDocument {
  name: string;
  description: string;
  tasks: string;
  active: boolean;
  id: string;
  grade: number;
  categoryId: string;
}

export interface ArchievedGrade {
  name: string;
  type: "category" | "goal";
  icon: string;
  color: string;
  grade: number;
  gradedAt: Date;
  id: string;
  userId: string;
}

export interface ThinkingQuestion {
  text: string;
}

export interface InteractiveQuestion {
  text: string;
  grade: number;
}

export interface MoodEmoji {
  image: string;
  color?: "darkgreen" | "lightgreen" | "yellow" | "orange" | "red";
  moodIndication: number;
  id?: string;
}

export interface MoodEntry {
  emoji: MoodEmoji;
  chosenAt: Date;
  userId?: string;
}

export interface MoodStatistic {
  emoji: MoodEmoji;
  timesChosen: number;
  date: Date;
}

export interface ArchievedMoodStatistic extends MoodStatistic {
  userId: string;
  id?: string;
}

export interface Question {
  text: string;
  categoryName: string;
  options: Option[];
}

export interface Option {
  text: string;
  grade: number;
}

export interface SummaryInfo {
  question: Question;
  selctedOption: Option;
}

export interface Message {
  label?: string;
  id?: string;
  notification: {
    title: string;
    body: string;
  };
  data: {
    type: string;
  };
  token?: string;
}

export type TimePeriod =
  | "day"
  | "week"
  | "month"
  | "year"
  | "1_month_ago"
  | "2_months_ago"
  | "3_months_ago"
  | "ever";

export interface ColumnConfig {
  label: string;
  inputType:
    | "text"
    | "date"
    | "select"
    | "custom"
    | "number"
    | "id"
    | "boolean";
  options?: { value: string; label: string }[];
  customComponent?: (row: any) => React.ReactNode;
  required?: boolean;
  isHiddenFromForm?: boolean;
}
