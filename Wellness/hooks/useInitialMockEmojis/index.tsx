import { useQuery } from "react-query";
import { readAllDocuments } from '@/firebase-config/firebase-generic'
import { MoodEmoji } from "@/types";

async function fetchEmojis() {
    try {
        return await readAllDocuments('initial-emojis') as MoodEmoji[];
    } catch (error) {
        console.error("Error fetching emojis:", error);
        throw error;
    }
}

export default function useInitialMockEmojis() {
    return useQuery({
        queryKey: ["initialMockEmojis"],
        queryFn: fetchEmojis,
    });
}   
