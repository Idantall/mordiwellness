import { NextResponse, NextRequest } from "next/server";
import axios from "axios";
import { FireStoreParser } from "@/app/utils/firestore";

const FIREBASE_FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export async function POST(request: NextRequest) {
    try {
        const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!accessToken) {
            return NextResponse.json(
                { error: "Access token is missing" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { collection, data } = body;

        if (!collection || !data) {
            return NextResponse.json(
                { error: "Missing collection or data" },
                { status: 400 }
            );
        }

        const firestoreData: { [key: string]: any } = { ...data };
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'boolean') {
                firestoreData[key] = { booleanValue: value };
            } else if (typeof value === 'number') {
                firestoreData[key] = { integerValue: value };
            } else {
                firestoreData[key] = { stringValue: String(value) };
            }
        }

        const response = await axios.post(
            `${FIREBASE_FIRESTORE_URL}/${collection}`,
            { fields: firestoreData },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.status !== 200) {
            throw new Error("Failed to create document");
        }

        const result = response.data;
        const documentId = result.name.split("/").pop();


        const FirebasePatchData = { ...firestoreData, id: { stringValue: documentId } };

        // Add the document ID as a property in the Firestore document
        await axios.patch(
            `${FIREBASE_FIRESTORE_URL}/${collection}/${documentId}`,
            { fields: FirebasePatchData },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return NextResponse.json({
            message: "Document created successfully",
            id: documentId,
        });
    } catch (error) {
        console.error("Error creating document:", error);
        return NextResponse.json(
            { error: "Failed to create document" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!accessToken) {
        return NextResponse.json(
            { error: "Access token is missing" },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");
    const id = searchParams.get("id");

    if (!collection) {
        return NextResponse.json(
            { error: "Collection name is required" },
            { status: 400 }
        );
    }

    

    const url = id
        ? `${FIREBASE_FIRESTORE_URL}/${collection}/${id}`
        : `${FIREBASE_FIRESTORE_URL}/${collection}`;

    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (response.status !== 200) {
        return NextResponse.json(
            { error: "Failed to fetch documents" },
            { status: response.status }
        );
    }

    const result = response.data;
    if (id) {
        if (!result.fields) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(FireStoreParser(result.fields));
    }

    if (!result.documents || result.documents.length === 0) {
        return NextResponse.json([]);
    }

    const documents = result.documents.map((doc: any) => ({
        id: doc.name.split("/").pop(),
        ...FireStoreParser(doc.fields),
    }));

    return NextResponse.json(documents);
}

export async function PUT(request: NextRequest) {
    try {
        const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");

        if (!accessToken) {
            return NextResponse.json(
                { error: "Access token is missing" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { collection, id, data } = body;

        if (!collection || !id || !data) {
            return NextResponse.json(
                { error: "Missing collection, id, or data" },
                { status: 400 }
            );
        }

        // Fetch the existing document to ensure we don't overwrite fields
        const existingResponse = await axios.get(
            `${FIREBASE_FIRESTORE_URL}/${collection}/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                validateStatus: null,
            }
        );

        if (existingResponse.status !== 200) {
            return NextResponse.json(
                { error: "Failed to fetch existing document" },
                { status: existingResponse.status }
            );
        }

        const existingData = existingResponse.data.fields || {};

        // Prepare the update data, preserving existing fields
        const firestoreData: { [key: string]: any } = { ...existingData };
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'boolean') {
                firestoreData[key] = { booleanValue: value };
            } else if (typeof value === 'number') {
                firestoreData[key] = { integerValue: value };
            } else {
                firestoreData[key] = { stringValue: String(value) };
            }
        }

        const response = await axios.patch(
            `${FIREBASE_FIRESTORE_URL}/${collection}/${id}`,
            { fields: firestoreData },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                timeout: 10000,
                validateStatus: null,
            }
        );

        if (response.status === 401) {
            return NextResponse.json(
                { error: "Unauthorized - Invalid or expired token" },
                { status: 401 }
            );
        }

        if (response.status !== 200) {
            return NextResponse.json(
                { 
                    error: `Failed to update document: ${response.statusText}`,
                    details: response.data
                },
                { status: response.status }
            );
        }

        return NextResponse.json({
            message: "Document updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating document:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        const errorMessage = error.code === 'ETIMEDOUT' 
            ? 'Request timed out. Please try again.'
            : error.response?.data?.error || error.message || 'Failed to update document';
            
        return NextResponse.json(
            { 
                error: errorMessage,
                details: error.response?.data
            },
            { status: error.response?.status || 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!accessToken) {
            return NextResponse.json(
                { error: "Access token is missing" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const collection = searchParams.get("collection");
        const id = searchParams.get("id");

        if (!collection || !id) {
            return NextResponse.json(
                { error: "Collection and id are required" },
                { status: 400 }
            );
        }

        const response = await axios.delete(
            `${FIREBASE_FIRESTORE_URL}/${collection}/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (response.status !== 200) {
            throw new Error("Failed to delete document");
        }

        return NextResponse.json({
            message: "Document deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json(
            { error: "Failed to delete document" },
            { status: 500 }
        );
    }
}
