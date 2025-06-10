import { getDocuments } from "@/app/utils/firestore";
import UsersClient from "./client";
import { getAccessTokenFromCookies } from "@/firebase/token";
import { cookies } from "next/headers";

export const metadata = {
  title: "ניהול משתמשים",
};

export default async function UsersPage() {
  const accessToken = await getAccessTokenFromCookies();

  if (!accessToken) {
    return <div>Access token is missing</div>;
  }

  const users = await getDocuments(accessToken, "users") || [];
  return <UsersClient initialUsers={users} token={accessToken} />;
}
