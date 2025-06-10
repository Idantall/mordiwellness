import { NextRequest, NextResponse } from "next/server";
import {
    authMiddleware,
    redirectToHome,
    redirectToLogin,
} from "next-firebase-auth-edge";
import { serverConfig } from "@/firebase";
import { clientConfig } from "@/firebase/client";

const PUBLIC_PATHS = ["/auth", "/delete-my-account"];

export default async function AuthMiddleware(request: NextRequest) {
    return authMiddleware(request, {
        loginPath: "/api/login",
        logoutPath: "/api/logout",
        apiKey: clientConfig.apiKey!,
        cookieName: serverConfig.cookieName!,
        cookieSignatureKeys: [serverConfig.cookieSignatureKeys!],
        cookieSerializeOptions: serverConfig.cookieSerializeOptions,
        serviceAccount: serverConfig.serviceAccount,
        authorizationHeaderName: "Authorization",

        handleValidToken: async ({ token, decodedToken }, headers) => {
            if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
                return redirectToHome(request, { path: "/main" });
            }

            return NextResponse.next({
                request: {
                    headers,
                },
            });
        },
        handleInvalidToken: async (reason) => {
            console.info("Missing or malformed credentials", { reason });

            return redirectToLogin(request, {
                path: "/auth",
                publicPaths: PUBLIC_PATHS,
            });
        },
        handleError: async (error) => {
            console.error("Unhandled authentication error", { error });

            return redirectToLogin(request, {
                path: "/auth",
                publicPaths: PUBLIC_PATHS,
            });
        },
    });
}

export const config = {
    matcher: ["/", "/((?!_next|api|.*\\.).*)", "/api/login", "/api/logout"],
};
