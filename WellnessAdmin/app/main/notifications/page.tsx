import { getDocuments } from "@/app/utils/firestore";
import { getAccessTokenFromCookies } from "@/firebase/token";
import SmsManagmentClient from "./client";
import { Account } from "@/types";

export default async function Component() {
  try {
    const accessToken = await getAccessTokenFromCookies();
    const messageTypes = await getDocuments(accessToken!, "initial-messages");
    const users = (await getDocuments(accessToken!, "users")) as Account[];
    return <SmsManagmentClient accessToken={accessToken!} messages={messageTypes} users={users} />;
  } catch (err) {
    console.error(err);
    return <div>שגיאה בעת טעינת העמוד</div>;
  }
}
