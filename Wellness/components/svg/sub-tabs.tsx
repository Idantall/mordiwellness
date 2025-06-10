import { Pressable, View, Text } from "react-native";

interface SubTabsProps {
    activeSubTab: number,
    toggleActiveSubTab: (index: number) => void
}

export default function SubTabs(props: SubTabsProps) {
    return (
        <View className="flex flex-row justify-center items-center gap-6">{['קטגוריה', 'מטרות'].map((tab, index) => (
            <Pressable
              key={index}
              onPress={() => props.toggleActiveSubTab(index)}
              className={`py-2 px-6 rounded-lg ${props.activeSubTab === index ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <Text className={`${props.activeSubTab === index ? 'text-white' : 'text-gray-700'} text-base font-semibold`}>
                {tab}
              </Text>
            </Pressable>
          ))}</View>
    )
}
