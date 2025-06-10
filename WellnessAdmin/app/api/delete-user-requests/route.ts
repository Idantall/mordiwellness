import { NextResponse, NextRequest } from "next/server";
import axios from "axios";

const FIREBASE_FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export async function POST(request: NextRequest) {
    try {
        const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");

        const body = await request.json();
        const { displayName, phoneNumber, processed } = body;

        if (!displayName || !phoneNumber || processed === undefined) {
            return NextResponse.json(
                { error: "Missing displayName, phoneNumber, or processed field" },
                { status: 400 }
            );
        }

        const firestoreData = {
            displayName: { stringValue: displayName },
            phoneNumber: { stringValue: phoneNumber },
            processed: { booleanValue: processed },
        };

        const response = await axios.post(
            `${FIREBASE_FIRESTORE_URL}/delete-user-requests`,
            { fields: firestoreData },
            {
                headers: {
                    Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.status !== 200) {
            throw new Error("Failed to create document");
        }

        const result = response.data;
        const documentId = result.name.split("/").pop();

        return NextResponse.json({
            message: "Delete user request created successfully",
            id: documentId,
        });
    } catch (error) {
        console.error("Error creating delete user request:", error);
        return NextResponse.json(
            { error: "Failed to create delete user request" },
            { status: 500 }
        );
    }
}
