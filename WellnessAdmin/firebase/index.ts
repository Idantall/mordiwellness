export const serverConfig = {
    cookieName: process.env.NEXT_PUBLIC_FIREBASE_COOKIE_NAME as string,
    cookieSignatureKeys: process.env.NEXT_PUBLIC_FIREBASE_COOKIE_SIGNATURE_KEYS,
    cookieSerializeOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 31,
        path: "/",
        sameSite: "lax",
    },
    serviceAccount: {
        clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL as string,
        privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
        )!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
    },
};


export const API_URL = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_DEVELOPMENT_API_URL : process.env.NEXT_PUBLIC_API_URL;
