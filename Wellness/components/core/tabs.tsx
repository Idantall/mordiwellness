import { Pressable, View, Text } from "react-native"

interface TabsProps {
    tabsList: string[]
    activeTabIndex: number
    onTabIndexChange: (tab: number) => void
}

export default function Tabs({ tabsList, activeTabIndex, onTabIndexChange }: TabsProps) {
    return (
        <View className="flex flex-row justify-center items-center gap-4">
            {tabsList.map((tab, index) => {
                return <Pressable onPress={() => onTabIndexChange(index)} className={`py-2 px-6 rounded-lg ${activeTabIndex === index ? 'bg-blue-600' : 'bg-gray-200'}`} key={index}><Text className={`font-bold ${activeTabIndex === index ? "text-white" : "text-black"}`}>{tab}</Text></Pressable>
            })}
        </View>
    )
}
