import { cookies } from "next/headers";
import { serverConfig } from ".";
import { getTokens, getFirebaseAuth } from "next-firebase-auth-edge";
import { clientConfig } from "./client";

export async function getAccessTokenFromCookies(): Promise<string | null> {
    const cooikeStores = await cookies();
    const tokens = await getTokens(cooikeStores, {
        cookieName: serverConfig.cookieName!,
        cookieSignatureKeys: [serverConfig.cookieSignatureKeys!],
        apiKey: clientConfig.apiKey!,
        serviceAccount: serverConfig.serviceAccount,
    });

    const auth = getFirebaseAuth({
        serviceAccount: serverConfig.serviceAccount,
        apiKey: clientConfig.apiKey!,
    });
    const decodedToken = await auth.verifyIdToken(tokens?.token || "");

    if (!decodedToken || !tokens?.token) {
        return null;
    }

    return tokens.token;
}
