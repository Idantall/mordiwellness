import { getDocuments } from "@/app/utils/firestore";
import { getAccessTokenFromCookies } from "@/firebase/token";
import MoodsClient from "./client";
import { MoodEmoji } from "@/types";

export default async function MoodsPage() {
  try {
    const accessToken = await getAccessTokenFromCookies();
    if (!accessToken) {
      throw new Error("Failed to retrieve access token");
    }
    const moods = await getDocuments(accessToken, "initial-emojis") as MoodEmoji[];
    return <MoodsClient moods={moods} accessToken={accessToken} />;
  } catch (error) {
    console.error("Error fetching moods:", error);
    return <div>אירע בעייה בזמן טעינת המצבים</div>;
  }
}


